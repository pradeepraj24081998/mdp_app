export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  is_staff: boolean;
  roles: { id: string; name: string; code: string }[];
  created_at?: string;
  updated_at?: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  symbol: string;
  status?: string;
  created_at?: string;
}

export interface Material {
  id: string;
  material_code: string;
  name: string;
  description?: string;
  material_type: 'RAW_MATERIAL' | 'PACKING_MATERIAL' | 'CONSUMABLE' | 'OTHER';
  unit: string;
  unit_code?: string;
  unit_name?: string;
  minimum_stock: string | number;
  reorder_level: string | number;
  is_active: boolean;
  status?: string;
  created_at?: string;
}

export interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gst_number?: string;
  tax_number?: string;
  payment_terms?: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description?: string;
  category: string;
  unit: string;
  unit_code?: string;
  unit_name?: string;
  selling_price: string | number;
  cost_price: string | number;
  minimum_stock: string | number;
  status?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  customer_type: 'DEALER' | 'WHOLESALER' | 'RETAILER' | 'OTHER';
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gst_number?: string;
  credit_limit: string | number;
  payment_terms?: string;
  status?: string;
  created_at?: string;
}

export interface ProductionUnit {
  id: string;
  production_unit_code: string;
  name: string;
  description?: string;
  address?: string;
  manager?: string;
  manager_name?: string;
  status?: string;
  created_at?: string;
}

export interface Warehouse {
  id: string;
  warehouse_code: string;
  name: string;
  warehouse_type: 'RAW_MATERIAL' | 'FINISHED_GOODS' | 'PACKAGING' | 'QUARANTINE' | 'TRANSIT' | 'GENERAL';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  manager?: string;
  manager_name?: string;
  contact_phone?: string;
  contact_email?: string;
  capacity_sqft?: number | string;
  production_unit?: string | null;
  production_unit_name?: string | null;
  is_active?: boolean;
  status?: string;
  created_at?: string;
}


export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  date_of_birth?: string | null;
  joining_date?: string;
  department?: string;
  department_name?: string;
  designation?: string;
  designation_name?: string;
  employment_type: string;
  production_unit?: string | null;
  production_unit_name?: string | null;
  user?: string | null;
  user_email?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrderItem {
  id?: string;
  material: string;
  material_name?: string;
  material_code?: string;
  unit: string;
  unit_code?: string;
  quantity: string;
  unit_price: string;
  discount: string;
  tax: string;
  total: string;
}

export interface PurchaseOrder {
  id: string;
  purchase_number: string;
  vendor: string;
  vendor_name?: string;
  vendor_code?: string;
  purchase_date: string;
  expected_date: string;
  subtotal: string;
  discount: string;
  tax: string;
  freight: string;
  grand_total: string;
  notes: string;
  payment_terms: string;
  status: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  items?: PurchaseOrderItem[];
}

export interface DamagedMaterialReturn {
  id: string;
  inward_item: string;
  material_name?: string;
  vendor: string;
  vendor_name?: string;
  return_type: string;
  quantity: string | number;
  status: string;
  notes: string;
  created_at: string;
}

export interface InwardItem {
  id: string;
  material: string;
  material_name?: string;
  material_code?: string;
  ordered_quantity: string;
  received_quantity: string;
  accepted_quantity: string;
  damaged_quantity: string;
  rejected_quantity: string;
  unit_code?: string;
  verification_status: string;
  remarks: string;
  return_requests?: DamagedMaterialReturn[];
}

export interface InwardReceipt {
  id: string;
  inward_number: string;
  purchase_order: string;
  purchase_number?: string;
  vendor_name?: string;
  received_date: string;
  invoice_number: string;
  received_by_name?: string;
  is_stock_updated: boolean;
  status: string;
  items?: InwardItem[];
}

export interface StockBalance {
  id: string;
  material?: string;
  material_name?: string;
  material_code?: string;
  product?: string;
  product_name?: string;
  product_code?: string;
  unit_code: string;
  category?: string;
  minimum_stock?: number;
  reorder_level?: number;
  cost_price?: number;
  valuation?: number;
  location?: string;
  location_name?: string;
  batch_number?: string;
  usable_quantity: string;
  reserved_quantity: string;
  quarantined_quantity: string;
  updated_at: string;
}

export interface InventorySummary {
  total_catalog_items: number;
  total_materials: number;
  total_products: number;
  in_stock_items: number;
  low_stock_items: number;
  out_of_stock_items: number;
  active_lots: number;
  quarantined_lots: number;
  total_usable_units: number;
  total_reserved_units: number;
  total_quarantined_units: number;
  total_valuation: number;
}

export interface InventoryCatalogItem {
  id: string;
  item_type: 'MATERIAL' | 'PRODUCT';
  item_code: string;
  item_name: string;
  category: string;
  unit_code: string;
  usable_quantity: number;
  reserved_quantity: number;
  quarantined_quantity: number;
  minimum_stock: number;
  reorder_level: number;
  cost_price: number;
  valuation: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface StockTransaction {
  id: string;
  transaction_type: string;
  material_name?: string;
  product_name?: string;
  quantity: string;
  unit_code: string;
  rate: string;
  value: string;
  reference_type: string;
  from_location_name?: string;
  to_location_name?: string;
  balance_after: string;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  production_number: string;
  production_unit_name: string;
  product_name: string;
  batch_number: string;
  planned_quantity: string;
  actual_quantity: string;
  start_date: string;
  expected_completion: string;
  status: string;
}

export interface SalesOrder {
  id: string;
  sales_order_number: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  payment_type: string;
  subtotal: string;
  grand_total: string;
  paid_amount: string;
  status: string;
  is_stock_deducted: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}
