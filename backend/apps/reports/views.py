import csv
from decimal import Decimal
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from common.responses import success_response, error_response
from .services import DashboardService
from apps.inventory.models import StockBalance, StockTransaction
from apps.purchasing.models import PurchaseOrder
from apps.sales.models import SalesOrder, Invoice
from apps.production.models import ProductionOrder

class DashboardMetricsView(APIView):
    def get(self, request):
        kpis = DashboardService.get_kpis(request.user)
        charts = DashboardService.get_charts()
        return success_response(
            data={'kpis': kpis, 'charts': charts},
            message="Dashboard analytics fetched successfully"
        )


class InventoryReportView(APIView):
    def get(self, request):
        export = request.query_params.get('export')
        balances = StockBalance.objects.select_related(
            'material', 'product', 'location', 'material__unit', 'product__unit'
        ).all()

        rows = []
        for b in balances:
            item_name = b.material.name if b.material else (b.product.product_name if b.product else 'Item')
            item_code = b.material.material_code if b.material else (b.product.product_code if b.product else 'N/A')
            unit = b.material.unit.code if b.material else (b.product.unit.code if b.product else '')
            rows.append({
                'item_code': item_code,
                'item_name': item_name,
                'location': b.location.name if b.location else 'Main Warehouse',
                'usable_quantity': str(b.usable_quantity),
                'reserved_quantity': str(b.reserved_quantity),
                'quarantined_quantity': str(b.quarantined_quantity),
                'unit': unit,
            })

        if export == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="inventory_stock_report.csv"'
            writer = csv.DictWriter(response, fieldnames=['item_code', 'item_name', 'location', 'usable_quantity', 'reserved_quantity', 'quarantined_quantity', 'unit'])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
            return response

        return success_response(data=rows, message="Inventory report generated.")


class PurchaseReportView(APIView):
    def get(self, request):
        export = request.query_params.get('export')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = PurchaseOrder.objects.filter(is_deleted=False).select_related('vendor')
        if start_date:
            qs = qs.filter(purchase_date__gte=start_date)
        if end_date:
            qs = qs.filter(purchase_date__lte=end_date)

        rows = []
        for po in qs.order_by('-purchase_date'):
            rows.append({
                'purchase_number': po.purchase_number,
                'vendor': po.vendor.vendor_name,
                'purchase_date': str(po.purchase_date),
                'subtotal': str(po.subtotal),
                'tax': str(po.tax),
                'grand_total': str(po.grand_total),
                'status': po.status,
            })

        if export == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="purchase_summary_report.csv"'
            writer = csv.DictWriter(response, fieldnames=['purchase_number', 'vendor', 'purchase_date', 'subtotal', 'tax', 'grand_total', 'status'])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
            return response

        return success_response(data=rows, message="Purchase report generated.")


class SalesReportView(APIView):
    def get(self, request):
        export = request.query_params.get('export')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        qs = SalesOrder.objects.filter(is_deleted=False).select_related('customer')
        if start_date:
            qs = qs.filter(order_date__gte=start_date)
        if end_date:
            qs = qs.filter(order_date__lte=end_date)

        rows = []
        for so in qs.order_by('-order_date'):
            rows.append({
                'order_number': so.sales_order_number,
                'customer': so.customer.name,
                'order_date': str(so.order_date),
                'grand_total': str(so.grand_total),
                'paid_amount': str(so.paid_amount),
                'balance': str(so.grand_total - so.paid_amount),
                'status': so.status,
            })

        if export == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="sales_summary_report.csv"'
            writer = csv.DictWriter(response, fieldnames=['order_number', 'customer', 'order_date', 'grand_total', 'paid_amount', 'balance', 'status'])
            writer.writeheader()
            for r in rows:
                writer.writerow(r)
            return response

        return success_response(data=rows, message="Sales report generated.")
