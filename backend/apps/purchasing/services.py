from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from common.exceptions import InvalidStatusTransitionError, ApprovalPermissionError
from .models import PurchaseOrder, PurchaseApproval

APPROVAL_THRESHOLD_ADMIN = Decimal('50000.00')

class PurchaseService:
    @classmethod
    @transaction.atomic
    def submit_for_review(cls, purchase: PurchaseOrder, user) -> PurchaseOrder:
        if purchase.status not in ['DRAFT', 'ACTIVE']:
            raise InvalidStatusTransitionError(f"Cannot submit PO in status '{purchase.status}'. Expected 'DRAFT'.")
        purchase.status = 'MANAGER_REVIEW'
        purchase.updated_by = user
        purchase.save(update_fields=['status', 'updated_by', 'updated_at'])
        return purchase

    @classmethod
    @transaction.atomic
    def approve_purchase(cls, purchase: PurchaseOrder, user, notes: str = '') -> PurchaseOrder:
        # Check permissions & tiers
        is_admin = user.is_superuser or user.user_roles.filter(role__code__in=['SUPER_ADMIN', 'ADMIN']).exists()
        is_manager = is_admin or user.user_roles.filter(role__code__in=['MANAGER', 'PURCHASE_MANAGER']).exists()

        if not is_manager:
            raise ApprovalPermissionError("You do not have permission to approve Purchase Orders.")

        if purchase.status not in ['MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL']:
            raise InvalidStatusTransitionError(f"Cannot approve PO in status '{purchase.status}'.")

        if purchase.status == 'MANAGER_REVIEW':
            # Check threshold
            if purchase.grand_total >= APPROVAL_THRESHOLD_ADMIN and not is_admin:
                # Requires Tier 2 Admin approval
                purchase.status = 'PENDING_ADMIN_APPROVAL'
                PurchaseApproval.objects.create(
                    purchase_order=purchase,
                    tier=1,
                    action='APPROVED',
                    action_by=user,
                    notes=f"Tier 1 approved. Forwarded for Admin Approval (Total: ₹{purchase.grand_total}). {notes}".strip()
                )
            else:
                purchase.status = 'APPROVED'
                purchase.approved_by = user
                purchase.approved_at = timezone.now()
                PurchaseApproval.objects.create(
                    purchase_order=purchase,
                    tier=1 if purchase.grand_total < APPROVAL_THRESHOLD_ADMIN else 2,
                    action='APPROVED',
                    action_by=user,
                    notes=notes
                )
        elif purchase.status == 'PENDING_ADMIN_APPROVAL':
            if not is_admin:
                raise ApprovalPermissionError("This order requires ADMIN tier 2 approval.")
            purchase.status = 'APPROVED'
            purchase.approved_by = user
            purchase.approved_at = timezone.now()
            PurchaseApproval.objects.create(
                purchase_order=purchase,
                tier=2,
                action='APPROVED',
                action_by=user,
                notes=notes
            )

        purchase.updated_by = user
        purchase.save()
        return purchase

    @classmethod
    @transaction.atomic
    def reject_purchase(cls, purchase: PurchaseOrder, user, reason: str) -> PurchaseOrder:
        if not reason or not reason.strip():
            raise ValueError("A specific rejection reason is mandatory.")

        if purchase.status not in ['DRAFT', 'SUBMITTED', 'MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL']:
            raise InvalidStatusTransitionError(f"Cannot reject PO in status '{purchase.status}'.")

        purchase.status = 'REJECTED'
        purchase.rejected_by = user
        purchase.rejected_at = timezone.now()
        purchase.rejection_reason = reason.strip()
        purchase.updated_by = user
        purchase.save()

        PurchaseApproval.objects.create(
            purchase_order=purchase,
            tier=2 if purchase.status == 'PENDING_ADMIN_APPROVAL' else 1,
            action='REJECTED',
            action_by=user,
            notes=reason
        )
        return purchase

    @classmethod
    @transaction.atomic
    def mark_ordered(cls, purchase: PurchaseOrder, user) -> PurchaseOrder:
        if purchase.status != 'APPROVED':
            raise InvalidStatusTransitionError(f"PO must be 'APPROVED' before ordering. Current status: '{purchase.status}'.")
        purchase.status = 'ORDERED'
        purchase.updated_by = user
        purchase.save(update_fields=['status', 'updated_by', 'updated_at'])
        return purchase
