from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import InvalidStatusTransitionError
from common.services import DocumentNumberService
from apps.purchasing.models import PurchaseOrder, PurchaseOrderItem
from .models import MaterialPlan

class PlanningService:
    @classmethod
    @transaction.atomic
    def submit_plan(cls, plan: MaterialPlan, user) -> MaterialPlan:
        if plan.status != 'DRAFT':
            raise InvalidStatusTransitionError(f"Cannot submit plan in status '{plan.status}'. Expected 'DRAFT'.")
        plan.status = 'SUBMITTED'
        plan.updated_by = user
        plan.save(update_fields=['status', 'updated_by', 'updated_at'])
        return plan

    @classmethod
    @transaction.atomic
    def approve_plan(cls, plan: MaterialPlan, user) -> MaterialPlan:
        if plan.status not in ['SUBMITTED', 'UNDER_REVIEW']:
            raise InvalidStatusTransitionError(f"Cannot approve plan in status '{plan.status}'.")
        plan.status = 'APPROVED'
        plan.approved_by = user
        plan.approved_at = timezone.now()
        plan.updated_by = user
        plan.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_by', 'updated_at'])
        return plan

    @classmethod
    @transaction.atomic
    def convert_to_purchase_order(cls, plan: MaterialPlan, user, vendor=None) -> PurchaseOrder:
        if plan.status in ['REJECTED', 'CANCELLED']:
            raise InvalidStatusTransitionError(f"Cannot convert {plan.status} plan to Purchase Order.")

        if plan.status != 'APPROVED':
            plan.status = 'APPROVED'
            plan.approved_by = user
            plan.approved_at = timezone.now()

        target_vendor = vendor or plan.vendor
        if not target_vendor:
            from apps.masters.models import Vendor
            target_vendor = Vendor.objects.filter(is_active=True, is_deleted=False).first()
            if not target_vendor:
                raise ValueError("A vendor must be specified to generate a Purchase Order.")

        po_number = DocumentNumberService.generate_number(prefix='PO')
        po = PurchaseOrder.objects.create(
            purchase_number=po_number,
            planning_document=plan,
            vendor=target_vendor,
            purchase_date=timezone.now().date(),
            expected_date=plan.required_date,
            status='DRAFT',
            notes=f"Generated from Planning Document: {plan.planning_number}. {plan.notes}".strip(),
            created_by=user
        )

        for item in plan.items.filter(is_deleted=False):
            unit_rate = item.estimated_rate or Decimal('0.00')
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                material=item.material,
                unit=item.unit,
                quantity=item.quantity,
                unit_price=unit_rate,
                discount=Decimal('0.00'),
                tax=Decimal('0.00'),
                created_by=user
            )

        po.recalculate_totals()
        po.save()

        plan.status = 'PURCHASE_CREATED'
        plan.updated_by = user
        plan.save(update_fields=['status', 'approved_by', 'approved_at', 'updated_by', 'updated_at'])
        return po
