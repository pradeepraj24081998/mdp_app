import uuid
from decimal import Decimal
from django.db import transaction
from common.exceptions import InsufficientStockError
from .models import StockBalance, StockTransaction

class InventoryService:
    """
    Centralized Inventory Service.
    MANDATORY RULE: All physical stock alterations across Purchasing, Inward,
    Production, Sales, and Transfers MUST execute through these methods.
    Direct modification of StockBalance outside this service is strictly prohibited.
    """

    @classmethod
    @transaction.atomic
    def _execute_movement(
        cls,
        *,
        transaction_type: str,
        material=None,
        product=None,
        quantity: Decimal,
        unit,
        rate: Decimal = Decimal('0.00'),
        from_location=None,
        to_location=None,
        reference_type: str,
        reference_id: uuid.UUID,
        created_by,
        batch_number: str = '',
        allow_negative: bool = False,
        notes: str = ''
    ) -> StockTransaction:
        if (material is None and product is None) or (material is not None and product is not None):
            raise ValueError("Exactly one of 'material' or 'product' must be specified.")

        quantity = Decimal(str(quantity))
        rate = Decimal(str(rate))
        if quantity <= Decimal('0.0000'):
            raise ValueError(f"Quantity must be strictly positive. Got: {quantity}")

        # 1. Deduct from source location if from_location is given
        source_balance = None
        if from_location:
            source_balance, _ = StockBalance.objects.select_for_update().get_or_create(
                material=material,
                product=product,
                location=from_location,
                batch_number=batch_number,
                defaults={'usable_quantity': Decimal('0.0000')}
            )
            if not allow_negative and source_balance.usable_quantity < quantity:
                item_name = material.name if material else product.product_name
                loc_name = from_location.name if from_location else 'Warehouse'
                raise InsufficientStockError(
                    f"Insufficient stock for '{item_name}' at {loc_name}. "
                    f"Available: {source_balance.usable_quantity}, Requested: {quantity}"
                )
            source_balance.usable_quantity -= quantity
            source_balance.save(update_fields=['usable_quantity', 'updated_at'])

        # 2. Add to target location if to_location is given
        target_balance = None
        if to_location:
            target_balance, _ = StockBalance.objects.select_for_update().get_or_create(
                material=material,
                product=product,
                location=to_location,
                batch_number=batch_number,
                defaults={'usable_quantity': Decimal('0.0000')}
            )
            target_balance.usable_quantity += quantity
            target_balance.save(update_fields=['usable_quantity', 'updated_at'])

        # Calculate balance after snapshot
        balance_after = (
            target_balance.usable_quantity if target_balance is not None
            else (source_balance.usable_quantity if source_balance is not None else Decimal('0.0000'))
        )

        # 3. Create immutable ledger record
        tx = StockTransaction.objects.create(
            transaction_type=transaction_type,
            material=material,
            product=product,
            quantity=quantity,
            unit=unit,
            rate=rate,
            value=(quantity * rate).quantize(Decimal('0.01')),
            reference_type=reference_type,
            reference_id=reference_id,
            from_location=from_location,
            to_location=to_location,
            balance_after=balance_after,
            notes=notes,
            created_by=created_by
        )
        return tx

    @classmethod
    def receive_material(
        cls, *, material, quantity: Decimal, unit, to_location,
        reference_id: uuid.UUID, created_by, rate: Decimal = Decimal('0.00'), notes: str = ''
    ) -> StockTransaction:
        """
        Invoked after inward gate receiving and QUALITY VERIFICATION approval.
        Only accepted verified quantity is added to usable stock.
        """
        return cls._execute_movement(
            transaction_type='PURCHASE_IN',
            material=material,
            quantity=quantity,
            unit=unit,
            rate=rate,
            to_location=to_location,
            reference_type='InwardVerification',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    def issue_material(
        cls, *, material, quantity: Decimal, unit, from_location, to_location,
        reference_id: uuid.UUID, created_by, notes: str = ''
    ) -> StockTransaction:
        """
        Invoked when raw materials are dispatched from warehouse to a production unit.
        """
        return cls._execute_movement(
            transaction_type='PRODUCTION_ISSUE',
            material=material,
            quantity=quantity,
            unit=unit,
            from_location=from_location,
            to_location=to_location,
            reference_type='MaterialDispatch',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    def consume_material(
        cls, *, material, quantity: Decimal, unit, from_location,
        reference_id: uuid.UUID, created_by, notes: str = ''
    ) -> StockTransaction:
        """
        Invoked during manufacturing run when raw materials are consumed in production batches.
        """
        return cls._execute_movement(
            transaction_type='PRODUCTION_CONSUMPTION',
            material=material,
            quantity=quantity,
            unit=unit,
            from_location=from_location,
            reference_type='ProductionConsumption',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    def add_finished_goods(
        cls, *, product, quantity: Decimal, unit, to_location, batch_number: str,
        reference_id: uuid.UUID, created_by, rate: Decimal = Decimal('0.00'), notes: str = ''
    ) -> StockTransaction:
        """
        Invoked when production batch completes and passes final Quality Check.
        """
        return cls._execute_movement(
            transaction_type='PRODUCTION_OUTPUT',
            product=product,
            quantity=quantity,
            unit=unit,
            rate=rate,
            to_location=to_location,
            batch_number=batch_number,
            reference_type='FinishedGoodsReceipt',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    def sell_product(
        cls, *, product, quantity: Decimal, unit, from_location,
        reference_id: uuid.UUID, created_by, rate: Decimal = Decimal('0.00'), notes: str = ''
    ) -> StockTransaction:
        """
        Invoked when customer Sales Order is fulfilled and dispatched.
        """
        return cls._execute_movement(
            transaction_type='SALES_OUT',
            product=product,
            quantity=quantity,
            unit=unit,
            rate=rate,
            from_location=from_location,
            reference_type='SalesDispatch',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    def process_sales_return(
        cls, *, product, quantity: Decimal, unit, to_location,
        reference_id: uuid.UUID, created_by, is_usable: bool = True, notes: str = ''
    ) -> StockTransaction:
        """
        Invoked when customer returns finished goods.
        If inspected as usable, added to available stock; otherwise marked as damaged/quarantine.
        """
        if is_usable:
            return cls._execute_movement(
                transaction_type='SALES_RETURN',
                product=product,
                quantity=quantity,
                unit=unit,
                to_location=to_location,
                reference_type='SalesReturn',
                reference_id=reference_id,
                created_by=created_by,
                notes=notes
            )
        else:
            # Segregated damage handling
            balance, _ = StockBalance.objects.select_for_update().get_or_create(
                product=product,
                location=to_location,
                defaults={'quarantined_quantity': Decimal('0.0000')}
            )
            balance.quarantined_quantity += Decimal(str(quantity))
            balance.save(update_fields=['quarantined_quantity', 'updated_at'])

            return StockTransaction.objects.create(
                transaction_type='SALES_RETURN',
                product=product,
                quantity=quantity,
                unit=unit,
                reference_type='SalesReturnQuarantine',
                reference_id=reference_id,
                to_location=to_location,
                balance_after=balance.usable_quantity,
                notes=f"[DAMAGED RETURN SEGREGATED] {notes}",
                created_by=created_by
            )

    @classmethod
    @transaction.atomic
    def adjust_stock(
        cls, *, material=None, product=None, quantity_diff: Decimal, unit, location,
        reference_id: uuid.UUID, created_by, reason: str = ''
    ) -> StockTransaction:
        """
        Invoked for approved stock reconciliations/audits.
        quantity_diff can be positive (surplus) or negative (deficit).
        """
        quantity_diff = Decimal(str(quantity_diff))
        if quantity_diff == Decimal('0.0000'):
            return None

        balance, _ = StockBalance.objects.select_for_update().get_or_create(
            material=material,
            product=product,
            location=location,
            defaults={'usable_quantity': Decimal('0.0000')}
        )

        new_usable = balance.usable_quantity + quantity_diff
        if new_usable < Decimal('0.0000'):
            raise InsufficientStockError("Stock adjustment cannot result in negative stock balance.")

        balance.usable_quantity = new_usable
        balance.save(update_fields=['usable_quantity', 'updated_at'])

        tx = StockTransaction.objects.create(
            transaction_type='STOCK_ADJUSTMENT',
            material=material,
            product=product,
            quantity=abs(quantity_diff),
            unit=unit,
            reference_type='StockAdjustment',
            reference_id=reference_id,
            to_location=location if quantity_diff > 0 else None,
            from_location=location if quantity_diff < 0 else None,
            balance_after=new_usable,
            notes=f"Adjustment: {quantity_diff:+} ({reason})",
            created_by=created_by
        )
        return tx

    @classmethod
    def transfer_stock(
        cls, *, material=None, product=None, quantity: Decimal, unit, from_location, to_location,
        reference_id: uuid.UUID, created_by, notes: str = ''
    ) -> StockTransaction:
        return cls._execute_movement(
            transaction_type='TRANSFER_OUT',
            material=material,
            product=product,
            quantity=quantity,
            unit=unit,
            from_location=from_location,
            to_location=to_location,
            reference_type='StockTransfer',
            reference_id=reference_id,
            created_by=created_by,
            notes=notes
        )

    @classmethod
    @transaction.atomic
    def record_opening_stock(
        cls, *, opening_stock_id: uuid.UUID, material=None, product=None,
        quantity: Decimal, unit, rate: Decimal, location, created_by
    ) -> StockTransaction:
        """
        Posts opening stock into both balance and immutable transaction ledger.
        """
        return cls._execute_movement(
            transaction_type='OPENING_STOCK',
            material=material,
            product=product,
            quantity=quantity,
            unit=unit,
            rate=rate,
            to_location=location,
            reference_type='OpeningStock',
            reference_id=opening_stock_id,
            created_by=created_by,
            notes="Initial opening stock migration"
        )
