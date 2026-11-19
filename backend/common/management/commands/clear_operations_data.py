from django.core.management.base import BaseCommand
from django.db import connection, transaction
from common.models import DocumentSequence


class Command(BaseCommand):
    help = "Clears all operational / transactional tables while strictly preserving master data, accounts, and configuration."

    def add_arguments(self, parser):
        parser.add_argument(
            '--no-input',
            action='store_true',
            dest='no_input',
            help='Execute without prompting for interactive confirmation',
        )
        parser.add_argument(
            '--keep-sequences',
            action='store_true',
            dest='keep_sequences',
            help='Do not reset DocumentSequence counters to 0',
        )

    def handle(self, *args, **options):
        no_input = options.get('no_input', False)
        keep_sequences = options.get('keep_sequences', False)

        operational_tables = [
            'audit_auditlog',
            'notifications_notification',
            'shipping_shipment',
            'sales_salesreturn',
            'sales_salespayment',
            'sales_invoiceitem',
            'sales_invoice',
            'sales_salesorderitem',
            'sales_salesorder',
            'production_finishedgoodsreceipt',
            'production_materialconsumption',
            'production_materialdispatch',
            'production_productionorderemployee',
            'production_productionorder',
            'inward_damagedmaterialreturn',
            'inward_inwarditem',
            'inward_inwardreceipt',
            'purchasing_purchaseapproval',
            'purchasing_purchaseorderitem',
            'purchasing_purchaseorder',
            'planning_materialplanitem',
            'planning_materialplan',
            'inventory_stockadjustment',
            'inventory_stocktransfer',
            'inventory_openingstock',
            'inventory_stocktransaction',
            'inventory_stockbalance',
        ]

        master_tables = [
            ('accounts_user', 'Users'),
            ('accounts_role', 'Roles'),
            ('accounts_permission', 'Permissions'),
            ('accounts_userrole', 'User Roles'),
            ('accounts_rolepermission', 'Role Permissions'),
            ('employees_department', 'Departments'),
            ('employees_designation', 'Designations'),
            ('employees_employee', 'Employees'),
            ('masters_unit', 'Units of Measurement'),
            ('masters_material', 'Materials Catalog'),
            ('masters_vendor', 'Vendors Catalog'),
            ('masters_product', 'Products Catalog'),
            ('masters_customer', 'Customers Catalog'),
            ('masters_productionunit', 'Production Units / Warehouses'),
            ('masters_productionunitemployee', 'Production Unit Staff Assignments'),
        ]

        if not no_input:
            self.stdout.write(self.style.WARNING(
                "WARNING: This will permanently delete all operational records (POs, SOs, plans, stock transactions, etc.).\n"
                "All master catalog data (materials, products, vendors, customers, employees, users) will be PRESERVED."
            ))
            confirm = input("Are you sure you want to proceed? [y/N]: ")
            if confirm.lower() not in ('y', 'yes'):
                self.stdout.write(self.style.NOTICE("Operation cancelled."))
                return

        with transaction.atomic():
            with connection.cursor() as cursor:
                # 1. Truncate operational tables
                self.stdout.write(self.style.NOTICE("Truncating operational tables..."))
                truncate_sql = f"TRUNCATE TABLE {', '.join(operational_tables)} CASCADE;"
                cursor.execute(truncate_sql)

                # 2. Reset document sequences if requested
                if not keep_sequences:
                    DocumentSequence.objects.all().update(current_value=0)
                    self.stdout.write(self.style.SUCCESS("Reset all DocumentSequence counters to 0."))

                # 3. Report Master Tables (Preserved)
                self.stdout.write(self.style.SUCCESS("\n[PRESERVED] Master Tables:"))
                for table, label in master_tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table};")
                    count = cursor.fetchone()[0]
                    self.stdout.write(f"  - {label} ({table}): {count} rows")

                # 4. Report Operational Tables (Cleared)
                self.stdout.write(self.style.SUCCESS("\n[CLEARED] Operational Tables:"))
                for table in operational_tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {table};")
                    count = cursor.fetchone()[0]
                    status = f"{count} rows" if count == 0 else self.style.ERROR(f"{count} rows (NOT EMPTY!)")
                    self.stdout.write(f"  - {table}: {status}")

        self.stdout.write(self.style.SUCCESS("\nSuccessfully cleared all operations data! Master tables remain intact."))
