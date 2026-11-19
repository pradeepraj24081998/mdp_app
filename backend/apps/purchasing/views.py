from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django_filters.rest_framework import FilterSet, CharFilter
from common.responses import success_response, error_response
from .models import PurchaseOrder, PurchaseOrderItem
from .serializers import PurchaseOrderSerializer
from .services import PurchaseService
from apps.masters.models import Vendor, Material

class PurchaseOrderFilter(FilterSet):
    status = CharFilter(method='filter_by_status')

    class Meta:
        model = PurchaseOrder
        fields = ['status', 'vendor']

    def filter_by_status(self, queryset, name, value):
        if not value:
            return queryset
        if ',' in value:
            statuses = [s.strip() for s in value.split(',') if s.strip()]
            return queryset.filter(status__in=statuses)
        return queryset.filter(status=value)

class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.filter(is_deleted=False).select_related(
        'vendor', 'approved_by', 'rejected_by', 'planning_document'
    ).prefetch_related('items__material', 'items__unit', 'approvals__action_by').order_by('-created_at', '-purchase_date')
    serializer_class = PurchaseOrderSerializer
    filterset_class = PurchaseOrderFilter
    search_fields = [
        'purchase_number',
        'vendor__vendor_name',
        'notes',
        'items__material__name',
        'items__material__material_code'
    ]
    ordering_fields = [
        'created_at',
        'purchase_number',
        'vendor__vendor_name',
        'purchase_date',
        'expected_date',
        'subtotal',
        'tax',
        'grand_total',
        'status',
    ]
    ordering = ['-created_at', '-purchase_date']

    def get_queryset(self):
        from django.db.models import Count, Q
        # Automatically soft-delete any POs that have 0 non-deleted items so they never linger
        empty_ids = list(
            PurchaseOrder.objects.filter(is_deleted=False).annotate(
                item_count=Count('items', filter=Q(items__is_deleted=False))
            ).filter(item_count=0).values_list('id', flat=True)
        )
        if empty_ids:
            PurchaseOrder.objects.filter(id__in=empty_ids).update(is_deleted=True)

        qs = super().get_queryset()
        return qs.annotate(
            active_item_count=Count('items', filter=Q(items__is_deleted=False))
        ).filter(active_item_count__gt=0).distinct()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        po_number = instance.purchase_number
        instance.delete()  # BaseModel soft delete (is_deleted=True)
        return success_response(
            message=f"Purchase Order '{po_number}' has been deleted successfully."
        )

    @action(detail=True, methods=['post'], url_path='split-item-vendor')
    def split_item_to_vendor(self, request, pk=None):
        po = self.get_object()
        item_id = request.data.get('item_id')
        target_vendor_id = request.data.get('target_vendor_id')
        split_qty = request.data.get('quantity')
        unit_price = request.data.get('unit_price', 0)

        if not item_id or not target_vendor_id:
            return error_response(message="Both item_id and target_vendor_id are required.")

        target_vendor = Vendor.objects.filter(id=target_vendor_id, is_deleted=False).first()
        if not target_vendor:
            return error_response(message="Target vendor not found.")

        item = po.items.filter(id=item_id).first()
        if not item:
            return error_response(message="Specified material item was not found in this Purchase Order.")

        from common.services import DocumentNumberService
        from decimal import Decimal

        quantity = Decimal(str(split_qty)) if split_qty else item.quantity
        if quantity > item.quantity or quantity <= 0:
            return error_response(message=f"Invalid quantity. Must be between 1 and {item.quantity}.")

        new_po_number = DocumentNumberService.generate_number(prefix='PO')
        new_po = PurchaseOrder.objects.create(
            purchase_number=new_po_number,
            planning_document=po.planning_document,
            vendor=target_vendor,
            purchase_date=po.purchase_date,
            expected_date=po.expected_date,
            payment_terms=po.payment_terms or 'Net 30',
            status='DRAFT',
            notes=f"Sourced from alternative shop/vendor for {item.material.name}. Transferred from {po.purchase_number}.",
            created_by=request.user
        )

        PurchaseOrderItem.objects.create(
            purchase_order=new_po,
            material=item.material,
            unit=item.unit,
            quantity=quantity,
            unit_price=Decimal(str(unit_price or 0)),
            discount=Decimal('0.00'),
            tax=Decimal('0.00'),
            created_by=request.user
        )
        new_po.recalculate_totals()
        new_po.save()

        if quantity >= item.quantity:
            item.delete(hard=True)
        else:
            item.quantity -= quantity
            item.save()

        po.recalculate_totals()
        po.save()

        # If source PO now has 0 remaining items, soft-delete it so it doesn't linger empty
        if po.items.filter(is_deleted=False).count() == 0:
            po.delete()

        return success_response(
            data={
                'new_purchase_id': str(new_po.id),
                'new_purchase_number': new_po.purchase_number,
                'vendor_name': target_vendor.vendor_name,
                'material_name': item.material.name,
                'quantity': float(quantity)
            },
            message=f"Created new Purchase Order {new_po.purchase_number} with {target_vendor.vendor_name}."
        )

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        po = self.get_object()
        po = PurchaseService.submit_for_review(po, request.user)
        return success_response(data=self.get_serializer(po).data, message="Purchase order submitted for review.")

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = self.get_object()
        notes = request.data.get('notes', '')
        po = PurchaseService.approve_purchase(po, request.user, notes=notes)
        return success_response(data=self.get_serializer(po).data, message=f"Purchase order status updated to '{po.status}'.")

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        po = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return error_response(message="A reason must be provided for rejection.")
        po = PurchaseService.reject_purchase(po, request.user, reason=reason)
        return success_response(data=self.get_serializer(po).data, message="Purchase order has been rejected.")

    @action(detail=True, methods=['post'], url_path='mark-ordered')
    def mark_ordered(self, request, pk=None):
        po = self.get_object()
        po = PurchaseService.mark_ordered(po, request.user)
        return success_response(data=self.get_serializer(po).data, message="Purchase order marked as ORDERED.")

    @action(detail=True, methods=['get'])
    def print_document(self, request, pk=None):
        po = self.get_object()
        data = {
            'purchase_number': po.purchase_number,
            'purchase_date': str(po.purchase_date),
            'expected_date': str(po.expected_date),
            'company': {
                'name': 'Sri Sugandh Incense & Fragrances LLP',
                'address': 'Plot 42, Fragrance Industrial Zone, Bangalore, Karnataka - 560099',
                'gstin': '29ABCDE1234F1Z5',
                'phone': '+91 80 2345 6789',
                'email': 'procurement@srisugandh.com'
            },
            'vendor': {
                'name': po.vendor.vendor_name,
                'code': po.vendor.vendor_code,
                'contact_person': po.vendor.contact_person,
                'address': po.vendor.address,
                'city': po.vendor.city,
                'state': po.vendor.state,
                'gst_number': po.vendor.gst_number,
                'phone': po.vendor.phone,
            },
            'items': [
                {
                    'material_code': item.material.material_code,
                    'material_name': item.material.name,
                    'quantity': str(item.quantity),
                    'unit': item.unit.code,
                    'unit_price': str(item.unit_price),
                    'discount': str(item.discount),
                    'tax': str(item.tax),
                    'total': str(item.total),
                }
                for item in po.items.filter(is_deleted=False)
            ],
            'financials': {
                'subtotal': str(po.subtotal),
                'discount': str(po.discount),
                'tax': str(po.tax),
                'freight': str(po.freight),
                'grand_total': str(po.grand_total),
                'currency': po.currency
            },
            'payment_terms': po.payment_terms,
            'status': po.status,
            'approved_by': po.approved_by.get_full_name() if po.approved_by else None,
            'approved_at': str(po.approved_at) if po.approved_at else None,
        }
        return success_response(data=data, message="Print document payload generated.")

    @action(detail=False, methods=['get'], url_path='alternative-sources')
    def alternative_sources(self, request):
        material_id = request.query_params.get('material_id')
        if not material_id:
            return error_response(message="material_id query parameter is required.")

        # Find vendors who have supplied this material previously
        past_items = PurchaseOrderItem.objects.filter(
            material_id=material_id,
            purchase_order__status__in=['ORDERED', 'RECEIVED', 'COMPLETED']
        ).select_related('purchase_order__vendor', 'unit').order_by('-purchase_order__purchase_date')[:10]

        quotes = []
        for pi in past_items:
            quotes.append({
                'vendor_id': str(pi.purchase_order.vendor.id),
                'vendor_name': pi.purchase_order.vendor.vendor_name,
                'vendor_code': pi.purchase_order.vendor.vendor_code,
                'unit_price': str(pi.unit_price),
                'unit': pi.unit.code,
                'last_purchase_date': str(pi.purchase_order.purchase_date),
                'lead_time_days': 5, # Demo heuristic
            })
        return success_response(data=quotes, message="Alternative vendor purchase sources retrieved.")
