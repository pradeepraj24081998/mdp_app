from decimal import Decimal
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.masters.models import Unit, Material, Product, ProductionUnit
from apps.inventory.models import StockBalance, StockTransaction
from apps.inventory.services import InventoryService
from common.exceptions import InsufficientStockError

User = get_user_model()

class InventoryServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='testuser@srisugandh.com',
            username='testuser',
            password='12345'
        )
        self.kg = Unit.objects.create(code='KG', name='Kilogram')
        self.box = Unit.objects.create(code='BOX', name='Box')
        self.unit_a = ProductionUnit.objects.create(
            production_unit_code='PU-A',
            name='Unit A'
        )
        self.unit_b = ProductionUnit.objects.create(
            production_unit_code='PU-B',
            name='Unit B'
        )
        self.wood_powder = Material.objects.create(
            material_code='MAT-WOOD',
            name='Wood Powder',
            unit=self.kg,
            minimum_stock=Decimal('100.0000')
        )
        self.agarbatti = Product.objects.create(
            product_code='PRD-ROSE',
            product_name='Rose Agarbatti',
            unit=self.box,
            selling_price=Decimal('150.00')
        )

    def test_receive_material_creates_balance_and_ledger(self):
        ref_id = uuid.uuid4()
        tx = InventoryService.receive_material(
            material=self.wood_powder,
            quantity=Decimal('500.0000'),
            unit=self.kg,
            to_location=self.unit_a,
            reference_id=ref_id,
            created_by=self.user,
            rate=Decimal('50.00')
        )

        self.assertIsNotNone(tx)
        self.assertEqual(tx.transaction_type, 'PURCHASE_IN')
        self.assertEqual(tx.quantity, Decimal('500.0000'))
        self.assertEqual(tx.value, Decimal('25000.00'))

        balance = StockBalance.objects.get(material=self.wood_powder, location=self.unit_a)
        self.assertEqual(balance.usable_quantity, Decimal('500.0000'))

    def test_issue_material_decreases_source_and_increases_target(self):
        # 1. Receive initial stock
        InventoryService.receive_material(
            material=self.wood_powder,
            quantity=Decimal('300.0000'),
            unit=self.kg,
            to_location=self.unit_a,
            reference_id=uuid.uuid4(),
            created_by=self.user
        )

        # 2. Dispatch/Issue to Unit B
        InventoryService.issue_material(
            material=self.wood_powder,
            quantity=Decimal('100.0000'),
            unit=self.kg,
            from_location=self.unit_a,
            to_location=self.unit_b,
            reference_id=uuid.uuid4(),
            created_by=self.user
        )

        bal_a = StockBalance.objects.get(material=self.wood_powder, location=self.unit_a)
        bal_b = StockBalance.objects.get(material=self.wood_powder, location=self.unit_b)

        self.assertEqual(bal_a.usable_quantity, Decimal('200.0000'))
        self.assertEqual(bal_b.usable_quantity, Decimal('100.0000'))

    def test_insufficient_stock_prevents_negative_balance(self):
        # Initial stock 50kg
        InventoryService.receive_material(
            material=self.wood_powder,
            quantity=Decimal('50.0000'),
            unit=self.kg,
            to_location=self.unit_a,
            reference_id=uuid.uuid4(),
            created_by=self.user
        )

        # Attempt to issue 100kg
        with self.assertRaises(InsufficientStockError):
            InventoryService.issue_material(
                material=self.wood_powder,
                quantity=Decimal('100.0000'),
                unit=self.kg,
                from_location=self.unit_a,
                to_location=self.unit_b,
                reference_id=uuid.uuid4(),
                created_by=self.user
            )

        bal_a = StockBalance.objects.get(material=self.wood_powder, location=self.unit_a)
        self.assertEqual(bal_a.usable_quantity, Decimal('50.0000'))

    def test_sales_return_quarantines_damaged_units(self):
        # Customer returns damaged product
        tx = InventoryService.process_sales_return(
            product=self.agarbatti,
            quantity=Decimal('25.0000'),
            unit=self.box,
            to_location=self.unit_a,
            reference_id=uuid.uuid4(),
            created_by=self.user,
            is_usable=False
        )

        balance = StockBalance.objects.get(product=self.agarbatti, location=self.unit_a)
        self.assertEqual(balance.usable_quantity, Decimal('0.0000'))
        self.assertEqual(balance.quarantined_quantity, Decimal('25.0000'))
