from rest_framework import viewsets, status
from rest_framework.decorators import action
from common.responses import success_response, error_response
from .models import MaterialPlan
from .serializers import MaterialPlanSerializer
from .filters import MaterialPlanFilter
from .services import PlanningService
from apps.purchasing.serializers import PurchaseOrderSerializer

class MaterialPlanViewSet(viewsets.ModelViewSet):
    queryset = MaterialPlan.objects.filter(is_deleted=False).select_related('vendor', 'approved_by').prefetch_related('items__material', 'items__unit').order_by('-created_at', '-planning_date')
    serializer_class = MaterialPlanSerializer
    filterset_class = MaterialPlanFilter
    search_fields = [
        'planning_number',
        'vendor__vendor_name',
        'notes',
        'items__material__name',
        'items__material__material_code'
    ]
    ordering_fields = ['created_at', 'planning_number', 'vendor__vendor_name', 'planning_date', 'required_date', 'status']
    ordering = ['-created_at', '-planning_date']

    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        if plan.status == 'PURCHASE_CREATED':
            return error_response(
                message=f"Cannot delete plan '{plan.planning_number}' because a Purchase Order has already been generated from it.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        plan_num = plan.planning_number
        plan.delete()
        return success_response(message=f"Material Plan '{plan_num}' has been deleted successfully.")

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        plan = self.get_object()
        plan = PlanningService.submit_plan(plan, request.user)
        return success_response(data=self.get_serializer(plan).data, message="Plan submitted for review.")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        plan = self.get_object()
        plan = PlanningService.approve_plan(plan, request.user)
        return success_response(data=self.get_serializer(plan).data, message="Plan approved successfully.")

    @action(detail=True, methods=['post'], url_path='create-purchase')
    def create_purchase(self, request, pk=None):
        plan = self.get_object()
        vendor_id = request.data.get('vendor_id')
        vendor = None
        if vendor_id:
            from apps.masters.models import Vendor
            vendor = Vendor.objects.get(id=vendor_id)

        po = PlanningService.convert_to_purchase_order(plan, request.user, vendor=vendor)
        return success_response(
            data={'purchase_id': str(po.id), 'purchase_number': po.purchase_number},
            message=f"Purchase order {po.purchase_number} created successfully from plan."
        )
