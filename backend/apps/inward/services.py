from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import InvalidStatusTransitionError, BusinessLogicError
from apps.inventory.services import InventoryService
from apps.masters.models import ProductionUnit
from .models import InwardReceipt, InwardItem, DamagedMaterialReturn

class InwardService:
    @classmethod
    @transaction.atomic
    def verify_and_post_stock(
        cls,
        inward: InwardReceipt,
        verification_data: list,
        user,
        to_location=None
    ) -> InwardReceipt:
        """
        Enforces Business Rule:
        Received quantity does NOT automatically enter usable inventory!
        Only verified & accepted quantity enters usable stock through InventoryService.
        Damaged stock is segregated and tracked for vendor credit/replacement.
        """
        if inward.is_stock_updated:
            raise InvalidStatusTransitionError(f"Inward receipt '{inward.inward_number}' has already been verified and posted to stock.")

        # Default to main factory unit or first available if not explicitly provided
        if not to_location:
            to_location = ProductionUnit.objects.filter(is_deleted=False).first()

        any_damage = False
        any_rejection = False

        for v_item in verification_data:
            item_id = v_item.get('item_id')
            item = inward.items.get(id=item_id)

            accepted_qty = Decimal(str(v_item.get('accepted_quantity', '0.0000')))
            damaged_qty = Decimal(str(v_item.get('damaged_quantity', '0.0000')))
            rejected_qty = Decimal(str(v_item.get('rejected_quantity', '0.0000')))
            remarks = v_item.get('remarks', '')

            if accepted_qty < Decimal('0.0000') or damaged_qty < Decimal('0.0000') or rejected_qty < Decimal('0.0000'):
                raise BusinessLogicError(f"Quantities cannot be negative for material '{item.material.name}'.")

            total_accounted = accepted_qty + damaged_qty + rejected_qty
            if total_accounted > item.received_quantity:
                raise BusinessLogicError(
                    f"Sum of accepted ({accepted_qty}), damaged ({damaged_qty}), and rejected ({rejected_qty}) "
                    f"exceeds physical received quantity ({item.received_quantity}) for material '{item.material.name}'."
                )

            item.accepted_quantity = accepted_qty
            item.damaged_quantity = damaged_qty
            item.rejected_quantity = rejected_qty
            item.remarks = remarks

            if damaged_qty > 0:
                any_damage = True
                item.verification_status = 'DAMAGED'
                # Create vendor return claim
                DamagedMaterialReturn.objects.create(
                    inward_item=item,
                    vendor=inward.vendor,
                    return_type='CREDIT',
                    quantity=damaged_qty,
                    notes=f"Damaged in Inward {inward.inward_number}. {remarks}".strip(),
                    created_by=user
                )
            elif rejected_qty > 0:
                any_rejection = True
                item.verification_status = 'REJECTED'
            elif accepted_qty < item.ordered_quantity:
                item.verification_status = 'SHORT'
            else:
                item.verification_status = 'ACCEPTED'

            item.save()

            # ONLY ACCEPTED QUANTITY IS POSTED TO USABLE STOCK
            if accepted_qty > Decimal('0.0000'):
                InventoryService.receive_material(
                    material=item.material,
                    quantity=accepted_qty,
                    unit=item.unit,
                    to_location=to_location,
                    reference_id=inward.id,
                    created_by=user,
                    notes=f"Verified Inward {inward.inward_number} (PO: {inward.purchase_order.purchase_number})"
                )

        inward.is_stock_updated = True
        inward.status = 'PARTIALLY_ACCEPTED' if (any_damage or any_rejection) else 'VERIFIED'
        inward.updated_by = user
        inward.save()

        # Update Purchase Order status based on total fulfillment
        po = inward.purchase_order
        po_ordered_sum = sum(pi.quantity for pi in po.items.filter(is_deleted=False))
        # Total accepted across all verified inwards for this PO
        all_inwards = po.inward_receipts.filter(is_stock_updated=True)
        total_accepted = sum(
            item.accepted_quantity
            for inw in all_inwards
            for item in inw.items.filter(is_deleted=False)
        )

        if total_accepted >= po_ordered_sum:
            po.status = 'COMPLETED'
        elif total_accepted > Decimal('0.0000'):
            po.status = 'PARTIALLY_RECEIVED'
        po.updated_by = user
        po.save(update_fields=['status', 'updated_by', 'updated_at'])

        return inward
