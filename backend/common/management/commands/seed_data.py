import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import Role, Permission, UserRole, RolePermission
from apps.employees.models import Department, Designation, Employee
from apps.masters.models import Unit, Material, Vendor, Product, Customer, ProductionUnit, ProductionUnitEmployee
from apps.inventory.models import StockBalance, OpeningStock
from apps.inventory.services import InventoryService
from apps.planning.models import MaterialPlan, MaterialPlanItem
from apps.purchasing.models import PurchaseOrder, PurchaseOrderItem
from apps.purchasing.services import PurchaseService
from apps.sales.models import SalesOrder, SalesOrderItem
from common.services import DocumentNumberService

User = get_user_model()

class Command(BaseCommand):
    help = "Seed database with realistic initial data for Incense & Fragrance Manufacturing ERP."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding ERP Database..."))

        # 1. Permissions
        permissions_data = [
            ('user.view', 'View Users', 'ACCOUNTS'),
            ('user.create', 'Create Users', 'ACCOUNTS'),
            ('user.update', 'Update Users', 'ACCOUNTS'),
            ('role.manage', 'Manage Roles & Permissions', 'ACCOUNTS'),
            ('employee.view', 'View Employees', 'EMPLOYEES'),
            ('employee.create', 'Create Employees', 'EMPLOYEES'),
            ('master.manage', 'Manage Master Catalogs', 'MASTERS'),
            ('planning.view', 'View Procurement Plans', 'PLANNING'),
            ('planning.create', 'Create Procurement Plans', 'PLANNING'),
            ('planning.approve', 'Approve Procurement Plans', 'PLANNING'),
            ('purchase.view', 'View Purchase Orders', 'PURCHASING'),
            ('purchase.create', 'Create Purchase Orders', 'PURCHASING'),
            ('purchase.approve', 'Approve Purchase Orders', 'PURCHASING'),
            ('shipping.view', 'View Shipments', 'SHIPPING'),
            ('shipping.manage', 'Manage Shipments', 'SHIPPING'),
            ('inward.view', 'View Inward Receipts', 'INWARD'),
            ('inward.create', 'Create Inward Gate Slips', 'INWARD'),
            ('inward.verify', 'Verify Inward Material Quality', 'INWARD'),
            ('inventory.view', 'View Inventory Balances & Ledger', 'INVENTORY'),
            ('inventory.adjust', 'Perform Stock Adjustments & Opening Stock', 'INVENTORY'),
            ('inventory.transfer', 'Execute Stock Transfers', 'INVENTORY'),
            ('production.view', 'View Production Orders', 'PRODUCTION'),
            ('production.create', 'Create Production Orders', 'PRODUCTION'),
            ('production.dispatch', 'Dispatch Raw Materials to Units', 'PRODUCTION'),
            ('production.consume', 'Record Consumption & Wastage', 'PRODUCTION'),
            ('production.complete', 'Quality Check & Finish Batch', 'PRODUCTION'),
            ('sales.view', 'View Sales Orders & Invoices', 'SALES'),
            ('sales.create', 'Create Sales Orders', 'SALES'),
            ('sales.dispatch', 'Dispatch Sales Orders', 'SALES'),
            ('sales.payment', 'Record Payments', 'SALES'),
            ('sales.return', 'Process Returns', 'SALES'),
            ('reports.view', 'View BI Reports & Dashboards', 'REPORTS'),
            ('audit.view', 'View Immutable Compliance Audit Logs', 'AUDIT'),
        ]

        perm_objs = {}
        for code, name, module in permissions_data:
            p, _ = Permission.objects.get_or_create(code=code, defaults={'name': name, 'module': module})
            perm_objs[code] = p

        # 2. Roles
        roles_data = [
            ('SUPER_ADMIN', 'Super Administrator', list(perm_objs.keys())),
            ('ADMIN', 'System Administrator', list(perm_objs.keys())),
            ('MANAGER', 'General Operations Manager', [c for c in perm_objs.keys() if not c.startswith('role.')]),
            ('PURCHASE_MANAGER', 'Purchase & Procurement Manager', [
                'purchase.view', 'purchase.create', 'purchase.approve', 'planning.view', 'planning.create',
                'planning.approve', 'master.manage', 'inventory.view', 'reports.view'
            ]),
            ('STORE_MANAGER', 'Store & Inventory Keeper', [
                'inward.view', 'inward.create', 'inward.verify', 'inventory.view', 'inventory.adjust',
                'inventory.transfer', 'production.dispatch', 'shipping.view', 'reports.view'
            ]),
            ('PRODUCTION_MANAGER', 'Production & Manufacturing Manager', [
                'production.view', 'production.create', 'production.dispatch', 'production.consume',
                'production.complete', 'inventory.view', 'reports.view'
            ]),
            ('SALES_MANAGER', 'Sales & Distribution Manager', [
                'sales.view', 'sales.create', 'sales.dispatch', 'sales.payment', 'sales.return',
                'customer.view', 'inventory.view', 'reports.view'
            ]),
            ('ACCOUNTS', 'Accountant', [
                'sales.view', 'sales.payment', 'purchase.view', 'reports.view', 'inventory.view'
            ]),
            ('VIEWER', 'Read-Only Viewer', [
                'purchase.view', 'sales.view', 'inventory.view', 'reports.view', 'production.view'
            ]),
        ]

        role_objs = {}
        for code, name, perms in roles_data:
            r, _ = Role.objects.get_or_create(code=code, defaults={'name': name})
            role_objs[code] = r
            for p_code in perms:
                if p_code in perm_objs:
                    RolePermission.objects.get_or_create(role=r, permission=perm_objs[p_code])

        # 3. Users
        users_seed = [
            ('admin@mdp.com', 'admin', 'Admin', 'User', 'SUPER_ADMIN', True),
            ('manager@mdp.com', 'manager', 'Ramesh', 'Sharma', 'MANAGER', False),
            ('purchase@mdp.com', 'purchasemgr', 'Priya', 'Nair', 'PURCHASE_MANAGER', False),
            ('store@mdp.com', 'storemgr', 'Sunil', 'Verma', 'STORE_MANAGER', False),
            ('production@mdp.com', 'prodmgr', 'Anand', 'Kulkarni', 'PRODUCTION_MANAGER', False),
            ('sales@mdp.com', 'salesmgr', 'Vikram', 'Mehta', 'SALES_MANAGER', False),
            ('accounts@mdp.com', 'accountant', 'Deepa', 'Iyer', 'ACCOUNTS', False),
        ]

        user_objs = {}
        for email, username, first_name, last_name, role_code, is_staff in users_seed:
            u = User.objects.filter(email=email).first()
            if not u:
                u = User.objects.create_user(
                    email=email,
                    username=username,
                    password='12345',
                    first_name=first_name,
                    last_name=last_name,
                    is_staff=is_staff,
                    is_superuser=is_staff
                )
            user_objs[username] = u
            if role_code in role_objs:
                UserRole.objects.get_or_create(user=u, role=role_objs[role_code])

        admin_user = user_objs['admin']

        # 4. Departments & Designations
        dept_data = [
            ('ADMIN', 'Administration', 'General leadership and facility oversight'),
            ('PURCHASE', 'Purchase & Procurement', 'Raw material sourcing and vendor relations'),
            ('STORE', 'Store & Warehouse', 'Inventory custody and gate inward receiving'),
            ('PROD', 'Production', 'Incense rolling, perfuming, and packaging'),
            ('SALES', 'Sales & Marketing', 'Dealer network management and order processing'),
            ('ACCOUNTS', 'Finance & Accounts', 'Invoicing, ledger accounting, and taxation'),
            ('DISPATCH', 'Dispatch & Logistics', 'Finished goods shipping and transport tracking'),
        ]

        dept_objs = {}
        for code, name, desc in dept_data:
            d, _ = Department.objects.get_or_create(code=code, defaults={'name': name, 'description': desc, 'created_by': admin_user})
            dept_objs[code] = d

        desig_data = [
            ('MGR', 'General Manager', 'ADMIN'),
            ('PUR_EXEC', 'Purchase Executive', 'PURCHASE'),
            ('STORE_KP', 'Store Keeper', 'STORE'),
            ('PROD_SUP', 'Production Supervisor', 'PROD'),
            ('OPR', 'Machine Operator', 'PROD'),
            ('HANDLER', 'Material Handler', 'STORE'),
            ('QC_CHK', 'Quality Inspector', 'PROD'),
            ('SALES_EXEC', 'Sales Executive', 'SALES'),
            ('ACCT', 'Senior Accountant', 'ACCOUNTS'),
            ('DRIVER', 'Logistics Driver', 'DISPATCH'),
        ]

        desig_objs = {}
        for code, name, d_code in desig_data:
            des, _ = Designation.objects.get_or_create(code=code, defaults={'name': name, 'department': dept_objs[d_code], 'created_by': admin_user})
            desig_objs[code] = des

        # 5. Units of Measurement
        units_data = [
            ('KG', 'Kilogram', 'kg'),
            ('GRAM', 'Gram', 'g'),
            ('LT', 'Litre', 'L'),
            ('ML', 'Millilitre', 'ml'),
            ('COUNT', 'Count / Sticks', 'pcs'),
            ('BOX', 'Box', 'box'),
            ('PACKET', 'Packet', 'pkt'),
            ('METER', 'Meter', 'm'),
        ]

        unit_objs = {}
        for code, name, sym in units_data:
            u, _ = Unit.objects.get_or_create(code=code, defaults={'name': name, 'symbol': sym, 'created_by': admin_user})
            unit_objs[code] = u

        # 6. Production Units
        pu1, _ = ProductionUnit.objects.get_or_create(
            production_unit_code='PU-A',
            defaults={
                'name': 'Production Unit A (Rolling & Shaping)',
                'description': 'Main factory unit for raw incense stick rolling and drying',
                'address': 'Plot 41, Industrial Estate, Peenya, Bangalore',
                'created_by': admin_user
            }
        )
        pu2, _ = ProductionUnit.objects.get_or_create(
            production_unit_code='PU-B',
            defaults={
                'name': 'Production Unit B (Perfuming & Packaging)',
                'description': 'Specialized fragrance infusion and carton packing facility',
                'address': 'Plot 42, Industrial Estate, Peenya, Bangalore',
                'created_by': admin_user
            }
        )

        # 7. Employees (Workforce)
        employees_seed = [
            ('EMP-001', 'Ramesh Sharma', '+91 9845011111', 'ramesh@srisugandh.com', 'ADMIN', 'MGR', 'PERMANENT', user_objs['manager'], None),
            ('EMP-002', 'Priya Nair', '+91 9845022222', 'priya@srisugandh.com', 'PURCHASE', 'PUR_EXEC', 'PERMANENT', user_objs['purchasemgr'], None),
            ('EMP-003', 'Sunil Verma', '+91 9845033333', 'sunil@srisugandh.com', 'STORE', 'STORE_KP', 'PERMANENT', user_objs['storemgr'], None),
            ('EMP-004', 'Anand Kulkarni', '+91 9845044444', 'anand@srisugandh.com', 'PROD', 'PROD_SUP', 'PERMANENT', user_objs['prodmgr'], pu1),
            ('EMP-005', 'Manjunath Gowda', '+91 9845055555', None, 'STORE', 'HANDLER', 'PERMANENT', None, None),
            ('EMP-006', 'Suresh Kumar', '+91 9845066666', None, 'PROD', 'OPR', 'CONTRACT', None, pu1),
            ('EMP-007', 'Lakshmi Bai', '+91 9845077777', None, 'PROD', 'OPR', 'DAILY_WAGE', None, pu1),
            ('EMP-008', 'Kavitha Rao', '+91 9845088888', None, 'PROD', 'QC_CHK', 'PERMANENT', None, pu2),
            ('EMP-009', 'Govindappa D', '+91 9845099999', None, 'DISPATCH', 'DRIVER', 'PERMANENT', None, None),
        ]

        emp_objs = {}
        for ecode, name, phone, email, dcode, descode, emptype, u_link, pu in employees_seed:
            emp, _ = Employee.objects.get_or_create(
                employee_code=ecode,
                defaults={
                    'name': name,
                    'phone': phone,
                    'email': email,
                    'joining_date': datetime.date(2025, 1, 1),
                    'department': dept_objs[dcode],
                    'designation': desig_objs[descode],
                    'employment_type': emptype,
                    'production_unit': pu,
                    'user': u_link,
                    'created_by': admin_user
                }
            )
            emp_objs[ecode] = emp

        pu1.manager = emp_objs['EMP-004']
        pu1.save()

        # 8. Raw Materials
        materials_seed = [
            ('MAT-001', 'White Wood Powder', 'Fine sifted wood powder for clean combustion', 'RAW_MATERIAL', 'KG', Decimal('500.00'), Decimal('1000.00')),
            ('MAT-002', 'Activated Charcoal Powder', 'High-purity carbon base for incense burning', 'RAW_MATERIAL', 'KG', Decimal('300.00'), Decimal('600.00')),
            ('MAT-003', 'Raw Bamboo Sticks 8 inch', 'Round natural split bamboo sticks 8 inch length', 'RAW_MATERIAL', 'KG', Decimal('400.00'), Decimal('800.00')),
            ('MAT-004', 'Natural Jiggit Powder', 'Botanical binder bark powder', 'RAW_MATERIAL', 'KG', Decimal('200.00'), Decimal('400.00')),
            ('MAT-005', 'Royal Sandalwood Fragrance Oil', 'A-grade distilled aromatic oil blend', 'RAW_MATERIAL', 'LT', Decimal('50.00'), Decimal('100.00')),
            ('MAT-006', 'Rose Flora Essential Blend', 'Pure floral fragrance concentrate', 'RAW_MATERIAL', 'LT', Decimal('40.00'), Decimal('80.00')),
            ('MAT-007', 'Printed Hexagonal Outer Box', 'High-finish 6-color printed packaging carton', 'PACKING_MATERIAL', 'BOX', Decimal('2000.00'), Decimal('5000.00')),
            ('MAT-008', 'Moisture-proof Poly Pouch', 'Sealed internal protective packaging foil', 'PACKING_MATERIAL', 'PACKET', Decimal('3000.00'), Decimal('6000.00')),
        ]

        mat_objs = {}
        for mcode, mname, mdesc, mtype, ucode, min_stk, reord in materials_seed:
            m, _ = Material.objects.get_or_create(
                material_code=mcode,
                defaults={
                    'name': mname,
                    'description': mdesc,
                    'material_type': mtype,
                    'unit': unit_objs[ucode],
                    'minimum_stock': min_stk,
                    'reorder_level': reord,
                    'created_by': admin_user
                }
            )
            mat_objs[mcode] = m

        # 9. Vendors
        vendors_seed = [
            ('VEN-001', 'Karnataka Bamboo Craft Ltd', 'Girish Murthy', '+91 80 2839 1234', 'bamboo@karnatakacraft.in', 'Shivamogga Road, Bhadravathi', 'Bhadravathi', 'Karnataka', '29AABCK1234A1Z1', 'Net 30'),
            ('VEN-002', 'Mysore Aromatic Extracts & Oils', 'K. Raghavan', '+91 821 245 9876', 'orders@mysoreextracts.com', 'Sandal Complex, Hootagalli, Mysore', 'Mysore', 'Karnataka', '29AABCM5678B1Z2', 'Net 15'),
            ('VEN-003', 'Evergreen Forest Wood Mill', 'Mohan Lal', '+91 836 220 5432', 'evergreenwood@forestmill.in', 'Dharwad Industrial Area', 'Dharwad', 'Karnataka', '29AABCE9012C1Z3', 'Net 30'),
            ('VEN-004', 'Apex Polymer & Print Solutions', 'Sanjay Gupta', '+91 80 4123 7890', 'sales@apexprintpack.com', 'Peenya 3rd Phase, Bangalore', 'Bangalore', 'Karnataka', '29AABCA3456D1Z4', 'Net 45'),
        ]

        ven_objs = {}
        for vcode, vname, contact, phone, email, addr, city, state, gst, terms in vendors_seed:
            v, _ = Vendor.objects.get_or_create(
                vendor_code=vcode,
                defaults={
                    'vendor_name': vname,
                    'contact_person': contact,
                    'phone': phone,
                    'email': email,
                    'address': addr,
                    'city': city,
                    'state': state,
                    'gst_number': gst,
                    'payment_terms': terms,
                    'created_by': admin_user
                }
            )
            ven_objs[vcode] = v

        # 10. Products / Finished Goods
        products_seed = [
            ('PRD-001', 'Royal Sandalwood Premium Agarbatti 250g', 'Classic Mysore sandalwood fragrance incense pack', 'Incense Sticks', 'BOX', Decimal('180.00'), Decimal('95.00'), Decimal('500.00')),
            ('PRD-002', 'Rose Bloom Divine Flora 120g', 'Traditional hand-rolled rose petal scented incense', 'Incense Sticks', 'BOX', Decimal('120.00'), Decimal('62.00'), Decimal('400.00')),
            ('PRD-003', 'Mogra Night Jasmine Agarbatti 150g', 'Exotic white mogra floral incense sticks', 'Incense Sticks', 'BOX', Decimal('140.00'), Decimal('75.00'), Decimal('350.00')),
            ('PRD-004', 'Kesar Kasturi Luxury Dhoop Sticks', 'Charcoal-free saffron and musk herbal dhoop', 'Dhoop & Cones', 'PACKET', Decimal('220.00'), Decimal('115.00'), Decimal('250.00')),
        ]

        prod_objs = {}
        for pcode, pname, pdesc, cat, ucode, sell_p, cost_p, min_s in products_seed:
            p, _ = Product.objects.get_or_create(
                product_code=pcode,
                defaults={
                    'product_name': pname,
                    'description': pdesc,
                    'category': cat,
                    'unit': unit_objs[ucode],
                    'selling_price': sell_p,
                    'cost_price': cost_p,
                    'minimum_stock': min_s,
                    'created_by': admin_user
                }
            )
            prod_objs[pcode] = p

        # 11. Customers / Dealers
        customers_seed = [
            ('CUST-001', 'Sri Balaji Pooja Stores & Distributors', 'WHOLESALER', 'Balaji Chettiar', '+91 44 2811 0001', 'balaji@poojastores.in', '144 Mint Street, Sowcarpet', 'Chennai', 'Tamil Nadu', '33AABCS1111A1Z1', Decimal('500000.00'), 'Net 30'),
            ('CUST-002', 'National FMCG Distributors', 'DEALER', 'Rajesh Singhal', '+91 80 2670 4567', 'procurement@nationalfmcg.com', 'Avenue Road, City Market', 'Bangalore', 'Karnataka', '29AABCN2222B1Z2', Decimal('1000000.00'), 'Net 45'),
            ('CUST-003', 'Devotional Fragrance Hub', 'RETAILER', 'Pooja Agarwal', '+91 22 2430 9988', 'contact@devotionalhub.com', 'Dadar West', 'Mumbai', 'Maharashtra', '27AABCD3333C1Z3', Decimal('150000.00'), 'Net 15'),
        ]

        cust_objs = {}
        for ccode, cname, ctype, contact, phone, email, addr, city, state, gst, cred, terms in customers_seed:
            c, _ = Customer.objects.get_or_create(
                customer_code=ccode,
                defaults={
                    'name': cname,
                    'customer_type': ctype,
                    'contact_person': contact,
                    'phone': phone,
                    'email': email,
                    'address': addr,
                    'city': city,
                    'state': state,
                    'gst_number': gst,
                    'credit_limit': cred,
                    'payment_terms': terms,
                    'created_by': admin_user
                }
            )
            cust_objs[ccode] = c

        # 12. Opening Stock Migration
        self.stdout.write("Migrating opening stock...")
        opening_materials = [
            (mat_objs['MAT-001'], Decimal('2500.0000'), Decimal('45.00'), pu1),
            (mat_objs['MAT-002'], Decimal('1800.0000'), Decimal('35.00'), pu1),
            (mat_objs['MAT-003'], Decimal('3000.0000'), Decimal('80.00'), pu1),
            (mat_objs['MAT-004'], Decimal('1200.0000'), Decimal('120.00'), pu1),
            (mat_objs['MAT-005'], Decimal('250.0000'), Decimal('1500.00'), pu2),
            (mat_objs['MAT-006'], Decimal('180.0000'), Decimal('1200.00'), pu2),
            (mat_objs['MAT-007'], Decimal('8000.0000'), Decimal('8.50'), pu2),
        ]

        for mat, qty, rate, loc in opening_materials:
            opn_num = DocumentNumberService.generate_number(prefix='OPN')
            opn, created = OpeningStock.objects.get_or_create(
                opening_number=opn_num,
                defaults={
                    'material': mat,
                    'unit': mat.unit,
                    'quantity': qty,
                    'rate': rate,
                    'value': (qty * rate).quantize(Decimal('0.01')),
                    'location': loc,
                    'reason': 'Opening stock balance migration at system inception',
                    'is_posted': True,
                    'date': datetime.date(2026, 1, 1),
                    'created_by': admin_user
                }
            )
            if created:
                InventoryService.record_opening_stock(
                    opening_stock_id=opn.id,
                    material=mat,
                    quantity=qty,
                    unit=mat.unit,
                    rate=rate,
                    location=loc,
                    created_by=admin_user
                )

        # Finished Goods Opening Stock
        opening_products = [
            (prod_objs['PRD-001'], Decimal('1500.0000'), Decimal('95.00'), pu2),
            (prod_objs['PRD-002'], Decimal('850.0000'), Decimal('62.00'), pu2),
            (prod_objs['PRD-003'], Decimal('600.0000'), Decimal('75.00'), pu2),
        ]
        for prod, qty, rate, loc in opening_products:
            opn_num = DocumentNumberService.generate_number(prefix='OPN')
            opn, created = OpeningStock.objects.get_or_create(
                opening_number=opn_num,
                defaults={
                    'product': prod,
                    'unit': prod.unit,
                    'quantity': qty,
                    'rate': rate,
                    'value': (qty * rate).quantize(Decimal('0.01')),
                    'location': loc,
                    'reason': 'Initial warehouse finished goods stock',
                    'is_posted': True,
                    'date': datetime.date(2026, 1, 1),
                    'created_by': admin_user
                }
            )
            if created:
                InventoryService.record_opening_stock(
                    opening_stock_id=opn.id,
                    product=prod,
                    quantity=qty,
                    unit=prod.unit,
                    rate=rate,
                    location=loc,
                    created_by=admin_user
                )

        # 13. Sample Purchase Order Workflow Demonstration
        po_num = DocumentNumberService.generate_number(prefix='PO')
        po, created = PurchaseOrder.objects.get_or_create(
            purchase_number=po_num,
            defaults={
                'vendor': ven_objs['VEN-002'],
                'purchase_date': datetime.date.today(),
                'expected_date': datetime.date.today() + datetime.timedelta(days=7),
                'status': 'APPROVED',
                'payment_terms': 'Net 15',
                'notes': 'Procurement of premium sandalwood distillation blend for Diwali production run',
                'created_by': user_objs['purchasemgr'],
                'approved_by': user_objs['manager'],
                'approved_at': datetime.datetime.now(datetime.timezone.utc)
            }
        )
        if created:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                material=mat_objs['MAT-005'],
                unit=unit_objs['LT'],
                quantity=Decimal('50.0000'),
                unit_price=Decimal('1500.00'),
                discount=Decimal('1000.00'),
                tax=Decimal('13320.00'), # 18% GST approx
                created_by=user_objs['purchasemgr']
            )
            po.recalculate_totals()
            po.save()

        # 14. Sample Confirmed Sales Order
        so_num = DocumentNumberService.generate_number(prefix='SO')
        so, created = SalesOrder.objects.get_or_create(
            sales_order_number=so_num,
            defaults={
                'customer': cust_objs['CUST-001'],
                'order_date': datetime.date.today(),
                'delivery_date': datetime.date.today() + datetime.timedelta(days=3),
                'payment_type': 'CREDIT',
                'status': 'CONFIRMED',
                'notes': 'Diwali festival opening wholesale consignment',
                'created_by': user_objs['salesmgr']
            }
        )
        if created:
            SalesOrderItem.objects.create(
                sales_order=so,
                product=prod_objs['PRD-001'],
                quantity=Decimal('200.0000'),
                rate=Decimal('180.00'),
                discount=Decimal('1000.00'),
                tax=Decimal('4200.00'),
                created_by=user_objs['salesmgr']
            )
            SalesOrderItem.objects.create(
                sales_order=so,
                product=prod_objs['PRD-002'],
                quantity=Decimal('150.0000'),
                rate=Decimal('120.00'),
                discount=Decimal('500.00'),
                tax=Decimal('2100.00'),
                created_by=user_objs['salesmgr']
            )
            so.recalculate_totals()
            so.save()

        self.stdout.write(self.style.SUCCESS("ERP Database Seeded Successfully with Real Data!"))
