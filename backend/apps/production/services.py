from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import InvalidStatusTransitionError, BusinessLogicError
from common.services import DocumentNumberService
from apps.inventory.services import InventoryService
from .models import (
    ProductionOrder, MaterialDispatch, MaterialConsumption, FinishedGoodsReceipt
)

class ProductionService:
    @classmethod
    @transaction.atomic
    def dispatch_raw_material(
        cls,
        production_order: ProductionOrder,
        material,
        quantity: Decimal,
        unit,
        from_location,
        material_handler,
        user,
        notes: str = ''
    ) -> MaterialDispatch:
        quantity = Decimal(str(quantity))
        dispatch_num = DocumentNumberService.generate_number(prefix='DISP')

        dispatch = MaterialDispatch.objects.create(
            dispatch_number=dispatch_num,
            production_order=production_order,
            from_location=from_location,
            production_unit=production_order.production_unit,
            material=material,
            quantity=quantity,
            unit=unit,
            material_handler=material_handler,
            date=timezone.now().date(),
            notes=notes,
            created_by=user
        )

        # Issue material atomically from stock
        InventoryService.issue_material(
            material=material,
            quantity=quantity,
            unit=unit,
            from_location=from_location,
            to_location=production_order.production_unit,
            reference_id=dispatch.id,
            created_by=user,
            notes=f"Dispatch {dispatch_num} to {production_order.production_unit.name} for Order {production_order.production_number}"
        )

        if production_order.status in ['PLANNED', 'MATERIAL_REQUESTED']:
            production_order.status = 'MATERIAL_ISSUED'
            production_order.updated_by = user
            production_order.save(update_fields=['status', 'updated_by', 'updated_at'])

        return dispatch

    @classmethod
    @transaction.atomic
    def start_run(cls, production_order: ProductionOrder, user) -> ProductionOrder:
        if production_order.status not in ['MATERIAL_ISSUED', 'PLANNED']:
            raise InvalidStatusTransitionError(f"Cannot start production in status '{production_order.status}'.")
        production_order.status = 'IN_PROGRESS'
        production_order.updated_by = user
        production_order.save(update_fields=['status', 'updated_by', 'updated_at'])
        return production_order

    @classmethod
    @transaction.atomic
    def record_batch_consumption(
        cls,
        production_order: ProductionOrder,
        consumption_data: list,
        user
    ) -> list:
        consumptions = []
        for c_item in consumption_data:
            material = c_item.get('material')
            planned_qty = Decimal(str(c_item.get('planned_quantity', '0.0000')))
            issued_qty = Decimal(str(c_item.get('issued_quantity', '0.0000')))
            used_qty = Decimal(str(c_item.get('used_quantity', '0.0000')))
            wastage_qty = Decimal(str(c_item.get('wastage', '0.0000')))
            unit = c_item.get('unit')

            mc = MaterialConsumption.objects.create(
                production_order=production_order,
                material=material,
                planned_quantity=planned_qty,
                issued_quantity=issued_qty,
                used_quantity=used_qty,
                wastage=wastage_qty,
                unit=unit,
                created_by=user
            )
            consumptions.append(mc)

            # Deduct actual material consumed from production unit stock
            total_consumed = used_qty + wastage_qty
            if total_consumed > Decimal('0.0000'):
                InventoryService.consume_material(
                    material=material,
                    quantity=total_consumed,
                    unit=unit,
                    from_location=production_order.production_unit,
                    reference_id=mc.id,
                    created_by=user,
                    notes=f"Consumed in batch {production_order.batch_number} (Wastage: {wastage_qty})"
                )

        return consumptions

    @classmethod
    @transaction.atomic
    def complete_production_order(
        cls,
        production_order: ProductionOrder,
        actual_quantity: Decimal,
        quality_status: str,
        user,
        notes: str = ''
    ) -> FinishedGoodsReceipt:
        actual_quantity = Decimal(str(actual_quantity))
        production_order.actual_quantity = actual_quantity
        production_order.completed_date = timezone.now().date()
        production_order.status = 'COMPLETED' if quality_status == 'PASSED' else 'REJECTED'
        production_order.updated_by = user
        production_order.save()

        receipt = FinishedGoodsReceipt.objects.create(
            production_order=production_order,
            product=production_order.product,
            quantity=actual_quantity,
            unit=production_order.product.unit,
            batch_number=production_order.batch_number,
            production_unit=production_order.production_unit,
            quality_status=quality_status,
            date=timezone.now().date(),
            created_by=user
        )

        if quality_status == 'PASSED':
            InventoryService.add_finished_goods(
                product=production_order.product,
                quantity=actual_quantity,
                unit=production_order.product.unit,
                to_location=production_order.production_unit,
                batch_number=production_order.batch_number,
                reference_id=receipt.id,
                created_by=user,
                notes=f"Production output from batch {production_order.batch_number}"
            )

        return receipt
