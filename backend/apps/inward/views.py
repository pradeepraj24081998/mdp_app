from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from common.responses import success_response, error_response
from .models import InwardReceipt, DamagedMaterialReturn
from .serializers import InwardReceiptSerializer, DamagedMaterialReturnSerializer
from .services import InwardService

class InwardReceiptViewSet(viewsets.ModelViewSet):
    queryset = InwardReceipt.objects.filter(is_deleted=False).select_related(
        'purchase_order', 'vendor', 'received_by', 'shipment'
    ).prefetch_related('items__material', 'items__unit', 'items__return_requests').order_by('-created_at', '-received_date')
    serializer_class = InwardReceiptSerializer
    filterset_fields = ['status', 'vendor', 'purchase_order', 'is_stock_updated']
    search_fields = ['inward_number', 'purchase_order__purchase_number', 'invoice_number', 'vendor__vendor_name']
    ordering_fields = ['created_at', 'inward_number', 'received_date', 'status']
    ordering = ['-created_at', '-received_date']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(
            data=serializer.data,
            message="Gate inward delivery recorded successfully.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        inward = self.get_object()
        verification_items = request.data.get('items', [])
        if not verification_items:
            return error_response(message="Verification items payload is required.")

        to_location_id = request.data.get('to_location_id')
        to_location = None
        if to_location_id:
            from apps.masters.models import ProductionUnit
            to_location = ProductionUnit.objects.get(id=to_location_id)

        inward = InwardService.verify_and_post_stock(
            inward=inward,
            verification_data=verification_items,
            user=request.user,
            to_location=to_location
        )
        return success_response(
            data=self.get_serializer(inward).data,
            message="Material quality verified and usable stock successfully posted to inventory."
        )


class DamagedMaterialReturnViewSet(viewsets.ModelViewSet):
    queryset = DamagedMaterialReturn.objects.filter(is_deleted=False).select_related(
        'inward_item__material', 'vendor'
    ).order_by('-created_at')
    serializer_class = DamagedMaterialReturnSerializer
    filterset_fields = ['status', 'return_type', 'vendor']
    search_fields = ['inward_item__material__name', 'vendor__vendor_name', 'notes']
    ordering_fields = ['created_at', 'status', 'return_type']
    ordering = ['-created_at']
