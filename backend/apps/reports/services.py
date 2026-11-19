from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.purchasing.models import PurchaseOrder
from apps.sales.models import SalesOrder, Invoice, SalesOrderItem
from apps.production.models import ProductionOrder, FinishedGoodsReceipt
from apps.inventory.models import StockBalance, StockTransaction
from apps.inward.models import InwardReceipt
from apps.shipping.models import Shipment
from apps.masters.models import Material, Product, Vendor, Customer
from apps.audit.models import AuditLog

class DashboardService:
    @classmethod
    def get_kpis(cls, user=None):
        today = timezone.now().date()
        current_month_start = today.replace(day=1)

        # Sales KPIs (Real database aggregations)
        sales_today = SalesOrder.objects.filter(order_date=today, is_deleted=False).aggregate(total=models.Sum('grand_total'))['total'] or Decimal('0.00')
        sales_month = SalesOrder.objects.filter(order_date__gte=current_month_start, is_deleted=False).aggregate(total=models.Sum('grand_total'))['total'] or Decimal('0.00')

        # Purchase KPIs
        pending_purchases = PurchaseOrder.objects.filter(status__in=['SUBMITTED', 'MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'], is_deleted=False).count()
        approved_purchases_month = PurchaseOrder.objects.filter(purchase_date__gte=current_month_start, status__in=['APPROVED', 'ORDERED', 'COMPLETED'], is_deleted=False).aggregate(total=models.Sum('grand_total'))['total'] or Decimal('0.00')

        # Approvals pending
        pending_approvals = PurchaseOrder.objects.filter(status__in=['MANAGER_REVIEW', 'PENDING_ADMIN_APPROVAL'], is_deleted=False).count()

        # Real Low stock count: Materials and Products where total usable stock is <= minimum_stock
        low_stock_count = 0
        for mat in Material.objects.filter(is_deleted=False, minimum_stock__gt=0):
            stock = StockBalance.objects.filter(material=mat).aggregate(total=models.Sum('usable_quantity'))['total'] or Decimal('0.0000')
            if stock <= mat.minimum_stock:
                low_stock_count += 1
        for prod in Product.objects.filter(is_deleted=False, minimum_stock__gt=0):
            stock = StockBalance.objects.filter(product=prod).aggregate(total=models.Sum('usable_quantity'))['total'] or Decimal('0.0000')
            if stock <= prod.minimum_stock:
                low_stock_count += 1

        # Production KPIs
        production_today_units = FinishedGoodsReceipt.objects.filter(date=today, quality_status='PASSED').aggregate(total=models.Sum('quantity'))['total'] or Decimal('0.0000')
        active_production_orders = ProductionOrder.objects.filter(status__in=['IN_PROGRESS', 'MATERIAL_ISSUED', 'PLANNED'], is_deleted=False).count()

        # Inward & Shipping
        pending_inward = InwardReceipt.objects.filter(status='RECEIVED', is_stock_updated=False, is_deleted=False).count()
        in_transit_shipments = Shipment.objects.filter(status='IN_TRANSIT', is_deleted=False).count()

        # Receivables / Outstanding
        outstanding_payments = SalesOrder.objects.filter(
            status__in=['CONFIRMED', 'PAYMENT_PENDING', 'DISPATCHED', 'DELIVERED'],
            paid_amount__lt=models.F('grand_total'),
            is_deleted=False
        ).aggregate(
            total=models.Sum(models.F('grand_total') - models.F('paid_amount'))
        )['total'] or Decimal('0.00')

        # Master Catalog Counts
        total_materials = Material.objects.filter(is_deleted=False).count()
        total_products = Product.objects.filter(is_deleted=False).count()
        total_vendors = Vendor.objects.filter(is_deleted=False).count()
        total_customers = Customer.objects.filter(is_deleted=False).count()

        return {
            'sales_today': str(sales_today),
            'sales_month': str(sales_month),
            'pending_purchases': pending_purchases,
            'approved_purchases_month': str(approved_purchases_month),
            'pending_approvals': pending_approvals,
            'low_stock_count': low_stock_count,
            'production_today_units': str(production_today_units),
            'active_production_orders': active_production_orders,
            'pending_inward': pending_inward,
            'in_transit_shipments': in_transit_shipments,
            'outstanding_payments': str(outstanding_payments),
            'total_materials': total_materials,
            'total_products': total_products,
            'total_vendors': total_vendors,
            'total_customers': total_customers,
        }

    @classmethod
    def get_charts(cls):
        today = timezone.now().date()
        months_data = []
        for i in range(5, -1, -1):
            m = (today.month - i - 1) % 12 + 1
            y = today.year + (today.month - i - 1) // 12
            month_label = f"{y}-{m:02d}"

            sales_val = SalesOrder.objects.filter(
                order_date__year=y, order_date__month=m, is_deleted=False
            ).aggregate(t=models.Sum('grand_total'))['t'] or Decimal('0.00')

            purchase_val = PurchaseOrder.objects.filter(
                purchase_date__year=y, purchase_date__month=m, status__in=['APPROVED', 'ORDERED', 'RECEIVED', 'COMPLETED'], is_deleted=False
            ).aggregate(t=models.Sum('grand_total'))['t'] or Decimal('0.00')

            months_data.append({
                'month': month_label,
                'sales': float(sales_val),
                'purchases': float(purchase_val),
            })

        # Top Finished Goods by Sales Volume
        top_products = []
        items = SalesOrderItem.objects.filter(is_deleted=False).values(
            'product__product_name'
        ).annotate(
            total_qty=models.Sum('quantity'),
            total_revenue=models.Sum('total')
        ).order_by('-total_qty')[:5]

        palette = ['#7C3AED', '#0D9488', '#059669', '#E11D48', '#D97706']
        for idx, it in enumerate(items):
            if it['product__product_name']:
                top_products.append({
                    'product_name': it['product__product_name'],
                    'total_qty': float(it['total_qty'] or 0),
                    'total_revenue': float(it['total_revenue'] or 0),
                    'color': palette[idx % len(palette)],
                })

        # Real recent activities from AuditLog
        recent_logs = AuditLog.objects.select_related('user').order_by('-timestamp')[:6]
        recent_activities = []
        for log in recent_logs:
            user_display = log.user.get_full_name() or log.user.username if log.user else 'System'
            recent_activities.append({
                'time': log.timestamp.strftime('%I:%M %p'),
                'date': log.timestamp.strftime('%Y-%m-%d'),
                'text': f"{log.action} on {log.module}: {log.object_repr}",
                'user': user_display,
                'action': log.action,
                'module': log.module,
            })

        return {
            'revenue_trend': months_data,
            'top_products': top_products,
            'recent_activities': recent_activities,
        }
