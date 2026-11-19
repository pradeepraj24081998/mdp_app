from django.db import models
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from common.responses import success_response
from .models import StockBalance, StockTransaction, OpeningStock, StockAdjustment, StockTransfer
from .serializers import (
    StockBalanceSerializer, StockTransactionSerializer,
    OpeningStockSerializer, StockAdjustmentSerializer, StockTransferSerializer
)

class StockBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockBalance.objects.select_related('material', 'product', 'location', 'material__unit', 'product__unit').order_by('-updated_at')
    serializer_class = StockBalanceSerializer
    filterset_fields = ['material', 'product', 'location']
    search_fields = ['material__name', 'material__material_code', 'product__product_name', 'product__product_code']
    ordering_fields = ['updated_at', 'usable_quantity']
    ordering = ['-updated_at']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Returns materials where usable_quantity <= minimum_stock"""
        low_materials = StockBalance.objects.filter(
            material__isnull=False,
            usable_quantity__lte=models.F('material__minimum_stock')
        ).select_related('material', 'location')
        serializer = self.get_serializer(low_materials, many=True)
        return success_response(data=serializer.data, message="Low stock items retrieved")

    @action(detail=False, methods=['get'])
    def summary(self, request):
        from decimal import Decimal
        from apps.masters.models import Material, Product

        total_materials = Material.objects.filter(is_deleted=False).count()
        total_products = Product.objects.filter(is_deleted=False).count()
        total_catalog_items = total_materials + total_products

        stock_agg = StockBalance.objects.aggregate(
            total_usable=models.Sum('usable_quantity'),
            total_reserved=models.Sum('reserved_quantity'),
            total_quarantined=models.Sum('quarantined_quantity'),
        )
        total_usable_units = stock_agg['total_usable'] or Decimal('0.0000')
        total_reserved_units = stock_agg['total_reserved'] or Decimal('0.0000')
        total_quarantined_units = stock_agg['total_quarantined'] or Decimal('0.0000')

        mat_stocks = {
            s['material_id']: s['total']
            for s in StockBalance.objects.filter(material__isnull=False).values('material_id').annotate(total=models.Sum('usable_quantity'))
        }
        prod_stocks = {
            s['product_id']: s['total']
            for s in StockBalance.objects.filter(product__isnull=False).values('product_id').annotate(total=models.Sum('usable_quantity'))
        }

        in_stock_items = 0
        low_stock_items = 0
        out_of_stock_items = 0
        total_valuation = Decimal('0.00')

        for m in Material.objects.filter(is_deleted=False):
            st = mat_stocks.get(m.id, Decimal('0.0000'))
            min_st = m.minimum_stock or Decimal('0.0000')
            if min_st > 0 and st <= min_st:
                low_stock_items += 1
            if st > 0:
                in_stock_items += 1
            else:
                out_of_stock_items += 1

        for p in Product.objects.filter(is_deleted=False):
            st = prod_stocks.get(p.id, Decimal('0.0000'))
            min_st = p.minimum_stock or Decimal('0.0000')
            cost = p.cost_price or Decimal('0.00')
            total_valuation += st * cost
            if min_st > 0 and st <= min_st:
                low_stock_items += 1
            if st > 0:
                in_stock_items += 1
            else:
                out_of_stock_items += 1

        active_lots = StockBalance.objects.filter(usable_quantity__gt=0).count()
        quarantined_lots = StockBalance.objects.filter(quarantined_quantity__gt=0).count()

        return success_response(data={
            'total_catalog_items': total_catalog_items,
            'total_materials': total_materials,
            'total_products': total_products,
            'in_stock_items': in_stock_items,
            'low_stock_items': low_stock_items,
            'out_of_stock_items': out_of_stock_items,
            'active_lots': active_lots,
            'quarantined_lots': quarantined_lots,
            'total_usable_units': float(total_usable_units),
            'total_reserved_units': float(total_reserved_units),
            'total_quarantined_units': float(total_quarantined_units),
            'total_valuation': float(total_valuation),
        }, message="Inventory summary retrieved")

    @action(detail=False, methods=['get'])
    def all_items(self, request):
        from apps.masters.models import Material, Product

        mat_stocks = {
            s['material_id']: s
            for s in StockBalance.objects.filter(material__isnull=False).values('material_id').annotate(
                usable=models.Sum('usable_quantity'),
                reserved=models.Sum('reserved_quantity'),
                quarantined=models.Sum('quarantined_quantity'),
            )
        }
        prod_stocks = {
            s['product_id']: s
            for s in StockBalance.objects.filter(product__isnull=False).values('product_id').annotate(
                usable=models.Sum('usable_quantity'),
                reserved=models.Sum('reserved_quantity'),
                quarantined=models.Sum('quarantined_quantity'),
            )
        }

        items = []
        for m in Material.objects.filter(is_deleted=False).select_related('unit'):
            st_info = mat_stocks.get(m.id, {})
            usable = float(st_info.get('usable') or 0)
            reserved = float(st_info.get('reserved') or 0)
            quarantined = float(st_info.get('quarantined') or 0)
            min_st = float(m.minimum_stock or 0)
            reorder = float(m.reorder_level or 0)

            if min_st > 0 and usable <= min_st:
                status = 'LOW_STOCK'
            elif usable > 0:
                status = 'IN_STOCK'
            else:
                status = 'OUT_OF_STOCK'

            items.append({
                'id': str(m.id),
                'item_type': 'MATERIAL',
                'item_code': m.material_code,
                'item_name': m.name,
                'category': m.get_material_type_display(),
                'unit_code': m.unit.code if m.unit else '',
                'usable_quantity': usable,
                'reserved_quantity': reserved,
                'quarantined_quantity': quarantined,
                'minimum_stock': min_st,
                'reorder_level': reorder,
                'cost_price': 0.0,
                'valuation': 0.0,
                'status': status,
            })

        for p in Product.objects.filter(is_deleted=False).select_related('unit'):
            st_info = prod_stocks.get(p.id, {})
            usable = float(st_info.get('usable') or 0)
            reserved = float(st_info.get('reserved') or 0)
            quarantined = float(st_info.get('quarantined') or 0)
            min_st = float(p.minimum_stock or 0)
            cost = float(p.cost_price or 0)

            if min_st > 0 and usable <= min_st:
                status = 'LOW_STOCK'
            elif usable > 0:
                status = 'IN_STOCK'
            else:
                status = 'OUT_OF_STOCK'

            items.append({
                'id': str(p.id),
                'item_type': 'PRODUCT',
                'item_code': p.product_code,
                'item_name': p.product_name,
                'category': p.category or 'Finished Goods',
                'unit_code': p.unit.code if p.unit else '',
                'usable_quantity': usable,
                'reserved_quantity': reserved,
                'quarantined_quantity': quarantined,
                'minimum_stock': min_st,
                'reorder_level': min_st * 1.5,
                'cost_price': cost,
                'valuation': round(usable * cost, 2),
                'status': status,
            })

        return success_response(data=items, message="All items inventory retrieved")


class StockTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockTransaction.objects.select_related(
        'material', 'product', 'unit', 'from_location', 'to_location', 'created_by'
    ).order_by('-created_at')
    serializer_class = StockTransactionSerializer
    filterset_fields = ['transaction_type', 'material', 'product', 'from_location', 'to_location']
    search_fields = ['material__name', 'product__product_name', 'notes', 'reference_type']
    ordering_fields = ['created_at', 'quantity', 'transaction_type']
    ordering = ['-created_at']


class OpeningStockViewSet(viewsets.ModelViewSet):
    queryset = OpeningStock.objects.filter(is_deleted=False).select_related('material', 'product', 'unit', 'location').order_by('-created_at', '-date')
    serializer_class = OpeningStockSerializer
    filterset_fields = ['material', 'product', 'location', 'is_posted']
    search_fields = ['opening_number', 'material__name', 'product__product_name', 'reason']
    ordering_fields = ['created_at', 'opening_number', 'date']
    ordering = ['-created_at', '-date']


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.filter(is_deleted=False).select_related('material', 'product', 'location', 'unit', 'approved_by').order_by('-created_at')
    serializer_class = StockAdjustmentSerializer
    filterset_fields = ['material', 'product', 'location', 'reason_type', 'is_approved']
    search_fields = ['adjustment_number', 'material__name', 'product__product_name', 'reason']
    ordering_fields = ['created_at', 'adjustment_number']
    ordering = ['-created_at']


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.filter(is_deleted=False).select_related('material', 'product', 'unit', 'from_location', 'to_location').order_by('-created_at')
    serializer_class = StockTransferSerializer
    filterset_fields = ['material', 'product', 'from_location', 'to_location']
    search_fields = ['transfer_number', 'material__name', 'product__product_name', 'notes']
    ordering_fields = ['created_at', 'transfer_number']
    ordering = ['-created_at']
