from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from common.responses import success_response, error_response
from .models import ProductionOrder, MaterialDispatch, MaterialConsumption, FinishedGoodsReceipt
from .serializers import (
    ProductionOrderSerializer, MaterialDispatchSerializer,
    MaterialConsumptionSerializer, FinishedGoodsReceiptSerializer
)
from .services import ProductionService
from apps.masters.models import Material, ProductionUnit, Unit
from apps.employees.models import Employee

class ProductionOrderViewSet(viewsets.ModelViewSet):
    queryset = ProductionOrder.objects.filter(is_deleted=False).select_related(
        'product', 'production_unit', 'supervisor', 'product__unit'
    ).prefetch_related(
        'assigned_workers__employee',
        'dispatches__material',
        'dispatches__material_handler',
        'consumptions__material',
        'goods_receipts__product'
    ).order_by('-created_at', '-start_date')
    serializer_class = ProductionOrderSerializer
    filterset_fields = ['status', 'production_unit', 'product', 'supervisor']
    search_fields = ['production_number', 'batch_number', 'product__product_name']
    ordering_fields = ['created_at', 'production_number', 'batch_number', 'start_date', 'expected_completion', 'status']
    ordering = ['-created_at', '-start_date']

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        order = self.get_object()
        order = ProductionService.start_run(order, request.user)
        return success_response(data=self.get_serializer(order).data, message="Production started.")

    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_material(self, request, pk=None):
        order = self.get_object()
        material_id = request.data.get('material_id')
        quantity = request.data.get('quantity')
        unit_id = request.data.get('unit_id')
        from_location_id = request.data.get('from_location_id')
        handler_id = request.data.get('material_handler_id')
        notes = request.data.get('notes', '')

        if not all([material_id, quantity, unit_id, handler_id]):
            return error_response(message="material_id, quantity, unit_id, and material_handler_id are required.")

        material = Material.objects.get(id=material_id)
        unit = Unit.objects.get(id=unit_id)
        handler = Employee.objects.get(id=handler_id)
        from_location = ProductionUnit.objects.filter(id=from_location_id).first() if from_location_id else None

        dispatch_record = ProductionService.dispatch_raw_material(
            production_order=order,
            material=material,
            quantity=Decimal(str(quantity)),
            unit=unit,
            from_location=from_location,
            material_handler=handler,
            user=request.user,
            notes=notes
        )
        return success_response(
            data=MaterialDispatchSerializer(dispatch_record).data,
            message=f"Dispatched {quantity} {unit.code} of {material.name} to {order.production_unit.name}."
        )

    @action(detail=True, methods=['post'])
    def consume(self, request, pk=None):
        order = self.get_object()
        items = request.data.get('consumptions', [])
        if not items:
            return error_response(message="'consumptions' list is required.")

        consumption_data = []
        for it in items:
            mat = Material.objects.get(id=it['material_id'])
            u = Unit.objects.get(id=it.get('unit_id', mat.unit.id))
            consumption_data.append({
                'material': mat,
                'planned_quantity': it.get('planned_quantity', 0),
                'issued_quantity': it.get('issued_quantity', 0),
                'used_quantity': it['used_quantity'],
                'wastage': it.get('wastage', 0),
                'unit': u
            })

        consumptions = ProductionService.record_batch_consumption(order, consumption_data, request.user)
        return success_response(
            data=MaterialConsumptionSerializer(consumptions, many=True).data,
            message="Batch consumption recorded and raw material stock updated."
        )

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        order = self.get_object()
        actual_quantity = request.data.get('actual_quantity')
        quality_status = request.data.get('quality_status', 'PASSED')
        notes = request.data.get('notes', '')

        if not actual_quantity:
            return error_response(message="actual_quantity is required.")

        receipt = ProductionService.complete_production_order(
            production_order=order,
            actual_quantity=Decimal(str(actual_quantity)),
            quality_status=quality_status,
            user=request.user,
            notes=notes
        )
        return success_response(
            data=FinishedGoodsReceiptSerializer(receipt).data,
            message=f"Production order completed. {actual_quantity} units added to finished goods inventory."
        )


class MaterialDispatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MaterialDispatch.objects.filter(is_deleted=False).select_related(
        'production_order', 'material', 'unit', 'material_handler', 'production_unit', 'from_location'
    ).order_by('-created_at')
    serializer_class = MaterialDispatchSerializer
    filterset_fields = ['production_order', 'production_unit', 'material', 'material_handler']
    search_fields = ['dispatch_number', 'material__name', 'material_handler__name']
    ordering_fields = ['created_at', 'dispatch_number', 'date']
    ordering = ['-created_at']


class FinishedGoodsReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinishedGoodsReceipt.objects.filter(is_deleted=False).select_related(
        'production_order', 'product', 'unit', 'production_unit'
    ).order_by('-created_at')
    serializer_class = FinishedGoodsReceiptSerializer
    filterset_fields = ['product', 'production_unit', 'quality_status']
    search_fields = ['batch_number', 'product__product_name']
    ordering_fields = ['created_at', 'batch_number', 'date']
    ordering = ['-created_at']
