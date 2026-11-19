from decimal import Decimal
import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.accounts.models import Role, UserRole
from apps.masters.models import Unit, Material, Vendor
from apps.purchasing.models import PurchaseOrder, PurchaseOrderItem
from apps.purchasing.services import PurchaseService
from common.exceptions import InvalidStatusTransitionError, ApprovalPermissionError

User = get_user_model()

class PurchaseWorkflowTests(TestCase):
    def setUp(self):
        self.manager_role = Role.objects.create(name='Purchase Manager', code='PURCHASE_MANAGER')
        self.admin_role = Role.objects.create(name='Admin', code='ADMIN')

        self.buyer_user = User.objects.create_user(email='buyer@test.com', username='buyer', password='12345')
        self.manager_user = User.objects.create_user(email='mgr@test.com', username='mgr', password='12345')
        UserRole.objects.create(user=self.manager_user, role=self.manager_role)

        self.admin_user = User.objects.create_user(email='adm@test.com', username='adm', password='12345', is_staff=True, is_superuser=True)

        self.kg = Unit.objects.create(code='KG', name='Kilogram')
        self.vendor = Vendor.objects.create(vendor_code='V001', vendor_name='Test Vendor', phone='+91 9999999999')
        self.wood = Material.objects.create(material_code='MAT01', name='Wood', unit=self.kg)

    def test_low_value_purchase_approval(self):
        # Order < 50k should be approved directly by Manager
        po = PurchaseOrder.objects.create(
            purchase_number='PO-TEST-001',
            vendor=self.vendor,
            purchase_date=datetime.date.today(),
            expected_date=datetime.date.today() + datetime.timedelta(days=7),
            status='DRAFT',
            created_by=self.buyer_user
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            material=self.wood,
            unit=self.kg,
            quantity=Decimal('100.0000'),
            unit_price=Decimal('200.00'), # total = 20,000 (< 50,000)
            created_by=self.buyer_user
        )
        po.recalculate_totals()
        po.save()

        # Submit
        po = PurchaseService.submit_for_review(po, self.buyer_user)
        self.assertEqual(po.status, 'MANAGER_REVIEW')

        # Approve by manager
        po = PurchaseService.approve_purchase(po, self.manager_user)
        self.assertEqual(po.status, 'APPROVED')
        self.assertEqual(po.approved_by, self.manager_user)

    def test_high_value_purchase_requires_tier2_admin(self):
        # Order >= 50k requires Manager Tier 1 then Admin Tier 2
        po = PurchaseOrder.objects.create(
            purchase_number='PO-TEST-002',
            vendor=self.vendor,
            purchase_date=datetime.date.today(),
            expected_date=datetime.date.today() + datetime.timedelta(days=7),
            status='DRAFT',
            created_by=self.buyer_user
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            material=self.wood,
            unit=self.kg,
            quantity=Decimal('400.0000'),
            unit_price=Decimal('200.00'), # total = 80,000 (>= 50,000)
            created_by=self.buyer_user
        )
        po.recalculate_totals()
        po.save()

        po = PurchaseService.submit_for_review(po, self.buyer_user)
        self.assertEqual(po.status, 'MANAGER_REVIEW')

        # Manager approves -> transitions to PENDING_ADMIN_APPROVAL
        po = PurchaseService.approve_purchase(po, self.manager_user)
        self.assertEqual(po.status, 'PENDING_ADMIN_APPROVAL')

        # Admin approves -> transitions to APPROVED
        po = PurchaseService.approve_purchase(po, self.admin_user)
        self.assertEqual(po.status, 'APPROVED')
        self.assertEqual(po.approved_by, self.admin_user)

    def test_rejection_requires_reason(self):
        po = PurchaseOrder.objects.create(
            purchase_number='PO-TEST-003',
            vendor=self.vendor,
            purchase_date=datetime.date.today(),
            expected_date=datetime.date.today(),
            status='MANAGER_REVIEW',
            created_by=self.buyer_user
        )
        with self.assertRaises(ValueError):
            PurchaseService.reject_purchase(po, self.manager_user, reason="")

        po = PurchaseService.reject_purchase(po, self.manager_user, reason="Rate is too high compared to market.")
        self.assertEqual(po.status, 'REJECTED')
        self.assertEqual(po.rejection_reason, "Rate is too high compared to market.")
