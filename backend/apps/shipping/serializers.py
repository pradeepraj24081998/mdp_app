from rest_framework import serializers, viewsets
from .models import Shipment
from common.services import DocumentNumberService

class ShipmentSerializer(serializers.ModelSerializer):
    purchase_number = serializers.CharField(source='purchase_order.purchase_number', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'shipment_number', 'purchase_order', 'purchase_number',
            'lr_number', 'from_address', 'to_address', 'contact_number',
            'date', 'freight_charge', 'parcel_name', 'parcel_count',
            'transporter', 'vehicle_number', 'driver', 'driver_name',
            'notes', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'shipment_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['shipment_number'] = DocumentNumberService.generate_number(prefix='SHIP')
        validated_data['created_by'] = user
        return super().create(validated_data)


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.filter(is_deleted=False).select_related('purchase_order', 'driver').order_by('-created_at')
    serializer_class = ShipmentSerializer
    filterset_fields = ['status', 'purchase_order', 'driver']
    search_fields = ['shipment_number', 'lr_number', 'transporter', 'vehicle_number']
    ordering_fields = ['created_at', 'shipment_number', 'date', 'status']
    ordering = ['-created_at']
