import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { apiClient } from '../../api/client';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState } from '../../components/common/LoadingState';
import { MasterDetailModal } from './MasterDetailModal';
import { MasterEditModal } from './MasterEditModal';
import { RoleDetailModal } from '../users/RoleDetailModal';
import { RoleFormModal } from '../users/RoleFormModal';
import { UserDetailModal } from '../users/UserDetailModal';
import { UserFormModal } from '../users/UserFormModal';
import { EmployeeDetailModal } from '../employees/EmployeeDetailModal';
import { EmployeeFormModal } from '../employees/EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import { Material, Product, Vendor, Customer, ProductionUnit, Unit, Employee, User, Warehouse } from '../../types';

export const MastersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Tab routing (10 Master catalogs: Materials, Products, Vendors, Customers, Units, Warehouses, Production Units, Employees, Users, Roles)
  const getTabFromPath = (path: string) => {
    if (path.includes('/masters/materials')) return 0;
    if (path.includes('/masters/products')) return 1;
    if (path.includes('/masters/vendors')) return 2;
    if (path.includes('/masters/customers')) return 3;
    if (path.includes('/masters/units')) return 4;
    if (path.includes('/masters/warehouses')) return 5;
    if (path.includes('/masters/production-units')) return 6;
    if (path.includes('/masters/employees')) return 7;
    if (path.includes('/masters/users')) return 8;
    if (path.includes('/masters/roles')) return 9;
    return 0;
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
    setSearchQuery('');
  }, [location.pathname]);

  const handleTabChange = (_: React.SyntheticEvent, val: number) => {
    setActiveTab(val);
    setSearchQuery('');
    const paths = [
      '/masters/materials',
      '/masters/products',
      '/masters/vendors',
      '/masters/customers',
      '/masters/units',
      '/masters/warehouses',
      '/masters/production-units',
      '/masters/employees',
      '/masters/users',
      '/masters/roles',
    ];
    navigate(paths[val]);
  };


  // Employee Master Modals & Delete States
  const [employeeDetailState, setEmployeeDetailState] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [employeeFormState, setEmployeeFormState] = useState<{ open: boolean; employee: Employee | null }>({
    open: false,
    employee: null,
  });
  const [employeeDeleteState, setEmployeeDeleteState] = useState<{ open: boolean; employee: Employee | null; error?: string }>({
    open: false,
    employee: null,
    error: undefined,
  });

  // User Master Modals & Delete States
  const [userDetailState, setUserDetailState] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [userFormState, setUserFormState] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [userDeleteState, setUserDeleteState] = useState<{ open: boolean; user: User | null; error?: string }>({
    open: false,
    user: null,
    error: undefined,
  });

  // Role Master Modals & Delete States
  const [roleDetailState, setRoleDetailState] = useState<{ open: boolean; role: any }>({
    open: false,
    role: null,
  });
  const [roleFormState, setRoleFormState] = useState<{ open: boolean; role: any }>({
    open: false,
    role: null,
  });
  const [roleDeleteState, setRoleDeleteState] = useState<{ open: boolean; role: any; error?: string }>({
    open: false,
    role: null,
    error: undefined,
  });

  // View & Edit Modal States
  const [viewState, setViewState] = useState<{
    open: boolean;
    type: 'material' | 'product' | 'vendor' | 'customer' | 'unit' | 'production_unit' | 'warehouse';
    data: any;
  }>({
    open: false,
    type: 'material',
    data: null,
  });

  const [editState, setEditState] = useState<{
    open: boolean;
    type: 'material' | 'product' | 'vendor' | 'customer' | 'unit' | 'production_unit' | 'warehouse';
    data: any;
  }>({
    open: false,
    type: 'material',
    data: null,
  });

  const openView = (type: any, data: any) => {
    setViewState({ open: true, type, data });
  };

  const openEdit = (type: any, data: any) => {
    setEditState({ open: true, type, data });
  };

  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    type: 'material' | 'product' | 'vendor' | 'customer' | 'unit' | 'production_unit' | 'warehouse';
    data: any;
    error?: string;
  }>({
    open: false,
    type: 'material',
    data: null,
    error: undefined,
  });


  const openDelete = (type: any, data: any) => {
    setDeleteState({ open: true, type, data, error: undefined });
  };

  // Create Modals State
  const [matOpen, setMatOpen] = useState(false);
  const [matCode, setMatCode] = useState('');
  const [matName, setMatName] = useState('');
  const [matDesc, setMatDesc] = useState('');
  const [matType, setMatType] = useState('RAW_MATERIAL');
  const [matUnit, setMatUnit] = useState('');
  const [matMin, setMatMin] = useState(100);

  const [prodOpen, setProdOpen] = useState(false);
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('Incense Sticks');
  const [prodDesc, setProdDesc] = useState('');
  const [prodUnit, setProdUnit] = useState('');
  const [prodCost, setProdCost] = useState(0);
  const [prodSelling, setProdSelling] = useState(0);
  const [prodMin, setProdMin] = useState(50);

  const [venOpen, setVenOpen] = useState(false);
  const [venCode, setVenCode] = useState('');
  const [venName, setVenName] = useState('');
  const [venContact, setVenContact] = useState('');
  const [venPhone, setVenPhone] = useState('');
  const [venEmail, setVenEmail] = useState('');
  const [venGst, setVenGst] = useState('');
  const [venTax, setVenTax] = useState('');
  const [venAddress, setVenAddress] = useState('');
  const [venCity, setVenCity] = useState('');
  const [venState, setVenState] = useState('');

  const [custOpen, setCustOpen] = useState(false);
  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [custType, setCustType] = useState<'DEALER' | 'WHOLESALER' | 'RETAILER' | 'OTHER'>('DEALER');
  const [custContact, setCustContact] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custGst, setCustGst] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [custCredit, setCustCredit] = useState(50000);

  const [unitOpen, setUnitOpen] = useState(false);
  const [unitCode, setUnitCode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');

  const [whOpen, setWhOpen] = useState(false);
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whManager, setWhManager] = useState('');
  const [whAddress, setWhAddress] = useState('');


  const [puOpen, setPuOpen] = useState(false);
  const [puCode, setPuCode] = useState('');
  const [puName, setPuName] = useState('');
  const [puDesc, setPuDesc] = useState('');
  const [puAddress, setPuAddress] = useState('');
  const [puManager, setPuManager] = useState('');

  // Next Unique Code Queries
  const { data: nextMatCode = '' } = useQuery({
    queryKey: ['next-code-material'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/next-code/');
      return res.data.data?.code || '';
    },
    enabled: matOpen,
  });

  const { data: nextProdCode = '' } = useQuery({
    queryKey: ['next-code-product'],
    queryFn: async () => {
      const res = await apiClient.get('/products/next-code/');
      return res.data.data?.code || '';
    },
    enabled: prodOpen,
  });

  const { data: nextVenCode = '' } = useQuery({
    queryKey: ['next-code-vendor'],
    queryFn: async () => {
      const res = await apiClient.get('/vendors/next-code/');
      return res.data.data?.code || '';
    },
    enabled: venOpen,
  });

  const { data: nextCustCode = '' } = useQuery({
    queryKey: ['next-code-customer'],
    queryFn: async () => {
      const res = await apiClient.get('/customers/next-code/');
      return res.data.data?.code || '';
    },
    enabled: custOpen,
  });

  const { data: nextPuCode = '' } = useQuery({
    queryKey: ['next-code-pu'],
    queryFn: async () => {
      const res = await apiClient.get('/production-units/next-code/');
      return res.data.data?.code || '';
    },
    enabled: puOpen,
  });

  const { data: nextUnitCode = '' } = useQuery({
    queryKey: ['next-code-unit'],
    queryFn: async () => {
      const res = await apiClient.get('/units/next-code/');
      return res.data.data?.code || '';
    },
    enabled: unitOpen,
  });

  const { data: nextWhCode = '' } = useQuery({
    queryKey: ['next-code-warehouse'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses/next-code/');
      return res.data.data?.code || '';
    },
    enabled: whOpen,
  });


  // Queries - Load all master catalogs concurrently so tab counts are immediately visible
  const { data: materials = [], isLoading: loadingMat } = useQuery<Material[]>({
    queryKey: ['masters-materials'],
    queryFn: async () => {
      const res = await apiClient.get('/materials/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: products = [], isLoading: loadingProd } = useQuery<Product[]>({
    queryKey: ['masters-products'],
    queryFn: async () => {
      const res = await apiClient.get('/products/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: vendors = [], isLoading: loadingVen } = useQuery<Vendor[]>({
    queryKey: ['masters-vendors'],
    queryFn: async () => {
      const res = await apiClient.get('/vendors/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: customers = [], isLoading: loadingCust } = useQuery<Customer[]>({
    queryKey: ['masters-customers'],
    queryFn: async () => {
      const res = await apiClient.get('/customers/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: units = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ['masters-units'],
    queryFn: async () => {
      const res = await apiClient.get('/units/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: warehouses = [], isLoading: loadingWarehouses } = useQuery<Warehouse[]>({
    queryKey: ['masters-warehouses'],
    queryFn: async () => {
      const res = await apiClient.get('/warehouses/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });


  const { data: productionUnits = [], isLoading: loadingPU } = useQuery<ProductionUnit[]>({
    queryKey: ['masters-production-units'],
    queryFn: async () => {
      const res = await apiClient.get('/production-units/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<Employee[]>({
    queryKey: ['masters-employees-list'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles/');
      return Array.isArray(res.data.data) ? res.data.data : res.data.data.results || [];
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: string) => apiClient.delete(`/employees/${employeeId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-employees-list'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEmployeeDeleteState({ open: false, employee: null, error: undefined });
      if (employeeDetailState.open) setEmployeeDetailState({ open: false, employee: null });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete employee record.';
      setEmployeeDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => apiClient.delete(`/users/${userId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserDeleteState({ open: false, user: null, error: undefined });
      if (userDetailState.open) setUserDetailState({ open: false, user: null });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete user account.';
      setUserDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => apiClient.delete(`/roles/${roleId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setRoleDeleteState({ open: false, role: null, error: undefined });
      if (roleDetailState.open) setRoleDetailState({ open: false, role: null });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete role.';
      setRoleDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  // Create Mutations
  const createMaterialMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/materials/', {
        material_code: matCode || nextMatCode,
        name: matName,
        description: matDesc,
        material_type: matType,
        unit: matUnit,
        minimum_stock: Number(matMin),
        reorder_level: Number(matMin) * 2,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-materials'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-material'] });
      setMatOpen(false);
      setMatCode('');
      setMatName('');
      setMatDesc('');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/products/', {
        product_code: prodCode || nextProdCode,
        product_name: prodName,
        category: prodCat,
        description: prodDesc,
        unit: prodUnit,
        cost_price: Number(prodCost),
        selling_price: Number(prodSelling),
        minimum_stock: Number(prodMin),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-products'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-product'] });
      setProdOpen(false);
      setProdCode('');
      setProdName('');
      setProdDesc('');
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/vendors/', {
        vendor_code: venCode || nextVenCode,
        vendor_name: venName,
        contact_person: venContact,
        phone: venPhone,
        email: venEmail,
        gst_number: venGst,
        tax_number: venTax,
        address: venAddress,
        city: venCity,
        state: venState,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-vendors'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-vendor'] });
      setVenOpen(false);
      setVenCode('');
      setVenName('');
      setVenPhone('');
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/customers/', {
        customer_code: custCode || nextCustCode,
        name: custName,
        customer_type: custType,
        contact_person: custContact,
        phone: custPhone,
        email: custEmail,
        gst_number: custGst,
        city: custCity,
        state: custState,
        credit_limit: Number(custCredit),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-customers'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-customer'] });
      setCustOpen(false);
      setCustCode('');
      setCustName('');
      setCustPhone('');
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/units/', {
        code: (unitCode || nextUnitCode).toUpperCase(),
        name: unitName,
        symbol: unitSymbol,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-units'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-unit'] });
      setUnitOpen(false);
      setUnitCode('');
      setUnitName('');
      setUnitSymbol('');
    },
  });

  const createWarehouseMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        warehouse_code: whCode || nextWhCode,
        name: whName,
        address: whAddress,
      };
      if (whManager) payload.manager = whManager;
      const res = await apiClient.post('/warehouses/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-warehouse'] });
      setWhOpen(false);
      setWhCode('');
      setWhName('');
      setWhManager('');
      setWhAddress('');
    },
  });


  const createProductionUnitMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        production_unit_code: puCode || nextPuCode,
        name: puName,
        description: puDesc,
        address: puAddress,
      };
      if (puManager) {
        payload.manager = puManager;
      }
      const res = await apiClient.post('/production-units/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masters-production-units'] });
      queryClient.invalidateQueries({ queryKey: ['next-code-pu'] });
      setPuOpen(false);
      setPuCode('');
      setPuName('');
      setPuDesc('');
      setPuAddress('');
      setPuManager('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { type, data } = deleteState;
      let endpoint = '';
      let queryKey = '';
      switch (type) {
        case 'material':
          endpoint = `/materials/${data.id}/`;
          queryKey = 'masters-materials';
          break;
        case 'product':
          endpoint = `/products/${data.id}/`;
          queryKey = 'masters-products';
          break;
        case 'vendor':
          endpoint = `/vendors/${data.id}/`;
          queryKey = 'masters-vendors';
          break;
        case 'customer':
          endpoint = `/customers/${data.id}/`;
          queryKey = 'masters-customers';
          break;
        case 'unit':
          endpoint = `/units/${data.id}/`;
          queryKey = 'masters-units';
          break;
        case 'warehouse':
          endpoint = `/warehouses/${data.id}/`;
          queryKey = 'masters-warehouses';
          break;
        case 'production_unit':
          endpoint = `/production-units/${data.id}/`;
          queryKey = 'masters-production-units';
          break;
      }

      const res = await apiClient.delete(endpoint);
      return { res, queryKey };
    },
    onSuccess: ({ queryKey }) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      if (deleteState.type === 'unit') {
        queryClient.invalidateQueries({ queryKey: ['masters-units'] });
      }
      setDeleteState((prev) => ({ ...prev, open: false, data: null, error: undefined }));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete record.';
      setDeleteState((prev) => ({ ...prev, error: msg }));
    },
  });

  // Filtered Lists
  const q = searchQuery.toLowerCase().trim();

  const filteredMaterials = materials.filter(
    (m) =>
      !q ||
      m.material_code.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.material_type.toLowerCase().includes(q)
  );

  const filteredProducts = products.filter(
    (p) =>
      !q ||
      p.product_code.toLowerCase().includes(q) ||
      p.product_name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  );

  const filteredVendors = vendors.filter(
    (v) =>
      !q ||
      v.vendor_code.toLowerCase().includes(q) ||
      v.vendor_name.toLowerCase().includes(q) ||
      (v.contact_person && v.contact_person.toLowerCase().includes(q)) ||
      (v.phone && v.phone.includes(q))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      !q ||
      c.customer_code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.city && c.city.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
  );

  const filteredUnits = units.filter(
    (u) =>
      !q ||
      u.code.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.symbol && u.symbol.toLowerCase().includes(q))
  );

  const filteredProductionUnits = productionUnits.filter(
    (pu) =>
      !q ||
      pu.production_unit_code.toLowerCase().includes(q) ||
      pu.name.toLowerCase().includes(q) ||
      (pu.manager_name && pu.manager_name.toLowerCase().includes(q))
  );

  const filteredWarehouses = warehouses.filter(
    (w) =>
      !q ||
      w.warehouse_code.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      (w.manager_name && w.manager_name.toLowerCase().includes(q)) ||
      (w.address && w.address.toLowerCase().includes(q))
  );


  const filteredEmployees = employees.filter((e) => {
    if (!q) return true;
    return (
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.employee_code && e.employee_code.toLowerCase().includes(q)) ||
      (e.designation_name && e.designation_name.toLowerCase().includes(q)) ||
      (e.department_name && e.department_name.toLowerCase().includes(q)) ||
      (e.phone && e.phone.includes(q)) ||
      (e.email && e.email.toLowerCase().includes(q))
    );
  });

  const filteredUsers = users.filter((u) => {
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      u.roles?.some((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    );
  });

  const filteredRoles = roles.filter(
    (r: any) =>
      !q ||
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
  );

  const getDeleteItemLabel = () => {
    if (!deleteState.data) return '';
    const d = deleteState.data;
    switch (deleteState.type) {
      case 'material':
        return `${d.material_code || ''} - ${d.name || ''}`;
      case 'product':
        return `${d.product_code || ''} - ${d.product_name || ''}`;
      case 'vendor':
        return `${d.vendor_code || ''} - ${d.vendor_name || ''}`;
      case 'customer':
        return `${d.customer_code || ''} - ${d.name || ''}`;
      case 'unit':
        return `${d.code || ''} - ${d.name || ''} ${d.symbol ? `(${d.symbol})` : ''}`;
      case 'warehouse':
        return `${d.warehouse_code || ''} - ${d.name || ''}`;
      case 'production_unit':
        return `${d.production_unit_code || ''} - ${d.name || ''}`;
      default:
        return d.name || d.code || 'this record';
    }
  };


  const renderActionButtons = (type: any, rowData: any) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
      <Tooltip title="View Details" arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            openView(type, rowData);
          }}
          sx={{
            width: 30,
            height: 30,
            color: '#2563EB',
            bgcolor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            '&:hover': { bgcolor: '#DBEAFE' },
          }}
        >
          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit Record" arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(type, rowData);
          }}
          sx={{
            width: 30,
            height: 30,
            color: '#166534',
            bgcolor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            '&:hover': { bgcolor: '#DCFCE7' },
          }}
        >
          <EditOutlinedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Record" arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            openDelete(type, rowData);
          }}
          sx={{
            width: 30,
            height: 30,
            color: '#DC2626',
            bgcolor: '#FEF2F2',
            border: '1px solid #FECACA',
            '&:hover': { bgcolor: '#FEE2E2' },
          }}
        >
          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Business Master Catalogs"
        subtitle="Manage, view, and edit standardized materials, products, vendors, customers, units, manufacturing plants, employees, users, and roles"
        action={
          activeTab === 0 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setMatOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Raw Material
            </Button>
          ) : activeTab === 1 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setProdOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Finished Product
            </Button>
          ) : activeTab === 2 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setVenOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Vendor Supplier
            </Button>
          ) : activeTab === 3 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCustOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Dealer / Customer
            </Button>
          ) : activeTab === 4 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUnitOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Unit of Measurement
            </Button>
          ) : activeTab === 5 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setWhOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Warehouse
            </Button>
          ) : activeTab === 6 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setPuOpen(true)} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Production Unit
            </Button>
          ) : activeTab === 7 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEmployeeFormState({ open: true, employee: null })} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Employee
            </Button>
          ) : activeTab === 8 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUserFormState({ open: true, user: null })} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Create User Account
            </Button>
          ) : activeTab === 9 ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRoleFormState({ open: true, role: null })} sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}>
              Add Role Master
            </Button>
          ) : null
        }
      />

      <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '12px', bgcolor: '#FFFFFF' }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Header Controls: Tabs + Search Bar */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' }, gap: 2, mb: 2.5, pb: 1, borderBottom: '1px solid #F1F5F9' }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 44 }}>
              <Tab label={`Materials (${materials.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Products (${products.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Vendors (${vendors.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Customers (${customers.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Units (${units.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Warehouses (${warehouses.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Production Units (${productionUnits.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Employees (${employees.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Users (${users.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
              <Tab label={`Roles (${roles.length})`} sx={{ fontWeight: 700, fontSize: '0.85rem' }} />
            </Tabs>


            <TextField
              size="small"
              placeholder="Search catalog by code, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: '100%', md: 280 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <ClearOutlinedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Box>

          {/* TAB 0: MATERIALS */}
          {activeTab === 0 && (
            loadingMat ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>MATERIAL CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NAME & DESCRIPTION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY TYPE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>MIN STOCK</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>REORDER LEVEL</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No materials found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((m) => (
                        <TableRow
                          key={m.id}
                          hover
                          onClick={() => openView('material', m)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                            {m.material_code}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>
                              {m.name}
                            </Typography>
                            {m.description && (
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {m.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={m.material_type.replace(/_/g, ' ')}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 22,
                                bgcolor: m.material_type === 'PACKING_MATERIAL' ? '#F0FDF4' : '#EFF6FF',
                                color: m.material_type === 'PACKING_MATERIAL' ? '#166534' : '#1D4ED8',
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{Number(m.minimum_stock).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#D97706' }}>{Number(m.reorder_level).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{m.unit_code || 'NOS'}</TableCell>
                          <TableCell align="center">
                            {renderActionButtons('material', m)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 1: PRODUCTS */}
          {activeTab === 1 && (
            loadingProd ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCT CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCT NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CATEGORY</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>COST PRICE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>SELLING PRICE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UOM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No products found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((p) => (
                        <TableRow
                          key={p.id}
                          hover
                          onClick={() => openView('product', p)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                            {p.product_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{p.product_name}</TableCell>
                          <TableCell>
                            <Chip label={p.category} size="small" sx={{ fontSize: '0.7rem', height: 22, bgcolor: '#F8FAFC', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: '#64748B' }}>
                            ₹{Number(p.cost_price || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                            ₹{Number(p.selling_price || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{p.unit_code || 'BOX'}</TableCell>
                          <TableCell align="center">
                            {renderActionButtons('product', p)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 2: VENDORS */}
          {activeTab === 2 && (
            loadingVen ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>VENDOR CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SUPPLIER COMPANY</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CONTACT PERSON</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PHONE NUMBER</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>GSTIN / TAX NO</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PAYMENT TERMS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No vendors found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVendors.map((v) => (
                        <TableRow
                          key={v.id}
                          hover
                          onClick={() => openView('vendor', v)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                            {v.vendor_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{v.vendor_name}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{v.contact_person || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#1E293B' }}>{v.phone}</TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                            {v.gst_number || (v as any).tax_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Chip label={v.payment_terms || 'Net 30'} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#FFFBEB', color: '#D97706', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons('vendor', v)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 3: CUSTOMERS */}
          {activeTab === 3 && (
            loadingCust ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DEALER CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>CUSTOMER NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>LOCATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PHONE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>CREDIT LIMIT</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No customers found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((c) => (
                        <TableRow
                          key={c.id}
                          hover
                          onClick={() => openView('customer', c)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                            {c.customer_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{c.name}</TableCell>
                          <TableCell>
                            <Chip label={c.customer_type} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ color: '#475569' }}>{c.city ? `${c.city}, ${c.state || ''}` : '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{c.phone}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>
                            ₹{Number(c.credit_limit || 0).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons('customer', c)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 4: UNITS */}
          {activeTab === 4 && (
            loadingUnits ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UNIT CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UNIT NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>SYMBOL / ABBREVIATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No units found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUnits.map((u) => (
                        <TableRow
                          key={u.id}
                          hover
                          onClick={() => openView('unit', u)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#0891B2', fontFamily: 'monospace' }}>
                            {u.code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{u.name}</TableCell>
                          <TableCell>
                            <Chip label={u.symbol || u.code.toLowerCase()} size="small" sx={{ fontSize: '0.72rem', height: 22, bgcolor: '#ECFEFF', color: '#0891B2', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Chip label="ACTIVE" size="small" sx={{ fontSize: '0.68rem', height: 18, bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons('unit', u)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 5: WAREHOUSES MASTER */}
          {activeTab === 5 && (
            loadingWarehouses ? (
              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>WAREHOUSE CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>WAREHOUSE MANAGER</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ADDRESS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredWarehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No warehouse records found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWarehouses.map((wh) => (
                        <TableRow
                          key={wh.id}
                          hover
                          onClick={() => openView('warehouse', wh)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#0D9488', fontFamily: 'monospace' }}>
                            {wh.warehouse_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                            {wh.name}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#334155' }}>
                            {wh.manager_name || 'Unassigned'}
                          </TableCell>
                          <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                            {wh.address || '—'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={wh.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                height: 18,
                                bgcolor: wh.is_active !== false ? '#F0FDF4' : '#FEF2F2',
                                color: wh.is_active !== false ? '#166534' : '#DC2626',
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons('warehouse', wh)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 6: PRODUCTION UNITS */}
          {activeTab === 6 && (
            loadingPU ? (

              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>UNIT CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRODUCTION UNIT NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>FACILITY DESCRIPTION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ADDRESS LOCATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PLANT MANAGER</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredProductionUnits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No production units found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProductionUnits.map((pu) => (
                        <TableRow
                          key={pu.id}
                          hover
                          onClick={() => openView('production_unit', pu)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#7C3AED', fontFamily: 'monospace' }}>
                            {pu.production_unit_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{pu.name}</TableCell>
                          <TableCell sx={{ color: '#64748B', fontSize: '0.82rem', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pu.description || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem', color: '#475569', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {pu.address || '—'}
                          </TableCell>
                          <TableCell>
                            {pu.manager_name ? (
                              <Chip label={pu.manager_name} size="small" sx={{ fontSize: '0.72rem', height: 22, bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 600 }} />
                            ) : (
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Unassigned</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip label="ACTIVE" size="small" sx={{ fontSize: '0.68rem', height: 18, bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons('production_unit', pu)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 7: EMPLOYEES MASTER */}
          {activeTab === 7 && (
            loadingEmployees ? (

              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>EMPLOYEE CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DEPARTMENT</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>DESIGNATION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>EMPLOYMENT TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PHONE NUMBER</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEmployees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No employee records found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <TableRow
                          key={emp.id}
                          hover
                          onClick={() => setEmployeeDetailState({ open: true, employee: emp })}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 700, color: '#0284C7', fontFamily: 'monospace' }}>
                            {emp.employee_code}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>{emp.name}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{emp.department_name || '-'}</TableCell>
                          <TableCell sx={{ color: '#475569' }}>{emp.designation_name || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.employment_type?.replace(/_/g, ' ') || 'PERMANENT'}
                              size="small"
                              sx={{
                                fontSize: '0.72rem',
                                height: 22,
                                bgcolor: emp.employment_type === 'PERMANENT' ? '#ECFDF5' : '#EFF6FF',
                                color: emp.employment_type === 'PERMANENT' ? '#059669' : '#2563EB',
                                fontWeight: 600,
                                border: emp.employment_type === 'PERMANENT' ? '1px solid #A7F3D0' : '1px solid #BFDBFE',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#64748B' }}>{emp.phone}</TableCell>
                          <TableCell>
                            <Chip
                              label={emp.status || 'ACTIVE'}
                              size="small"
                              sx={{
                                fontSize: '0.68rem',
                                height: 18,
                                bgcolor: emp.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                color: emp.status === 'INACTIVE' ? '#DC2626' : '#166534',
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                              {/* View Employee */}
                              <Tooltip title="View Employee Profile" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setEmployeeDetailState({ open: true, employee: emp })}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    color: '#0284C7',
                                    bgcolor: '#F0F9FF',
                                    border: '1px solid #BAE6FD',
                                    '&:hover': { bgcolor: '#E0F2FE' },
                                  }}
                                >
                                  <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>

                              {/* Edit Employee */}
                              <Tooltip title="Edit Employee Details" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setEmployeeFormState({ open: true, employee: emp })}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    color: '#166534',
                                    bgcolor: '#F0FDF4',
                                    border: '1px solid #BBF7D0',
                                    '&:hover': { bgcolor: '#DCFCE7' },
                                  }}
                                >
                                  <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>

                              {/* Delete Employee */}
                              <Tooltip title="Delete Employee Record" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => setEmployeeDeleteState({ open: true, employee: emp, error: undefined })}
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    color: '#DC2626',
                                    bgcolor: '#FEF2F2',
                                    border: '1px solid #FECACA',
                                    '&:hover': { bgcolor: '#FEE2E2' },
                                  }}
                                >
                                  <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 8: USERS MASTER */}
          {activeTab === 8 && (
            loadingUsers ? (

              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>USER / EMAIL</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>FULL NAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>USERNAME</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>ASSIGNED ROLES</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>PRIVILEGES</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No user accounts found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelf = currentUser?.id === u.id;

                        return (
                          <TableRow
                            key={u.id}
                            hover
                            onClick={() => setUserDetailState({ open: true, user: u })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{u.email}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{u.full_name || '-'}</TableCell>
                            <TableCell sx={{ color: '#64748B', fontFamily: 'monospace' }}>@{u.username}</TableCell>
                            <TableCell>
                              {u.roles && u.roles.length > 0 ? (
                                u.roles.map((r) => (
                                  <Chip
                                    key={r.id}
                                    label={r.name}
                                    size="small"
                                    sx={{ mr: 0.5, mb: 0.5, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 600, fontSize: '0.72rem' }}
                                  />
                                ))
                              ) : (
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>No roles assigned</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={u.is_active ? 'ACTIVE' : 'INACTIVE'}
                                size="small"
                                sx={{
                                  bgcolor: u.is_active ? '#ECFDF5' : '#FEF2F2',
                                  color: u.is_active ? '#059669' : '#DC2626',
                                  fontWeight: 600,
                                  fontSize: '0.72rem',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {u.is_staff ? (
                                <Chip label="STAFF ADMIN" size="small" sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 600, fontSize: '0.72rem' }} />
                              ) : (
                                <Chip label="STANDARD" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 600, fontSize: '0.72rem' }} />
                              )}
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                {/* View User */}
                                <Tooltip title="View User Account Profile" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setUserDetailState({ open: true, user: u })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#2563EB',
                                      bgcolor: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      '&:hover': { bgcolor: '#DBEAFE' },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Edit User */}
                                <Tooltip title="Edit User Details & Roles" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setUserFormState({ open: true, user: u })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#166534',
                                      bgcolor: '#F0FDF4',
                                      border: '1px solid #BBF7D0',
                                      '&:hover': { bgcolor: '#DCFCE7' },
                                    }}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>

                                {/* Delete User */}
                                {isSelf ? (
                                  <Tooltip title="Your Logged-in Account (Protected)" arrow>
                                    <span>
                                      <IconButton
                                        size="small"
                                        disabled
                                        sx={{
                                          width: 30,
                                          height: 30,
                                          opacity: 0.4,
                                        }}
                                      >
                                        <LockOutlinedIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete User Account" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => setUserDeleteState({ open: true, user: u, error: undefined })}
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        color: '#DC2626',
                                        bgcolor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        '&:hover': { bgcolor: '#FEE2E2' },
                                      }}
                                    >
                                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}

          {/* TAB 9: ROLE MASTER */}
          {activeTab === 9 && (
            loadingRoles ? (

              <LoadingState rows={6} />
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 140 }}>ROLE CODE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 220 }}>ROLE TITLE</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>RESPONSIBILITIES & DESCRIPTION</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 150 }}>PERMISSIONS</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', width: 100 }}>STATUS</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 130 }}>ACTIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: '#94A3B8' }}>
                          No roles found matching criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoles.map((r: any) => {
                        const isSystem = r.code === 'SUPER_ADMIN' || r.code === 'ADMIN';

                        return (
                          <TableRow
                            key={r.id}
                            hover
                            onClick={() => setRoleDetailState({ open: true, role: r })}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ fontWeight: 700, color: '#2563EB', fontFamily: 'monospace' }}>
                              {r.code}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                              {r.name}
                            </TableCell>
                            <TableCell sx={{ color: '#64748B', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {r.description || 'System standard role'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${r.permissions?.length || 0} Permissions`}
                                size="small"
                                sx={{
                                  fontSize: '0.72rem',
                                  height: 22,
                                  bgcolor: '#EFF6FF',
                                  color: '#2563EB',
                                  fontWeight: 600,
                                  border: '1px solid #BFDBFE',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.status || 'ACTIVE'}
                                size="small"
                                sx={{
                                  fontSize: '0.68rem',
                                  height: 18,
                                  bgcolor: r.status === 'INACTIVE' ? '#FEF2F2' : '#F0FDF4',
                                  color: r.status === 'INACTIVE' ? '#DC2626' : '#166534',
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.8 }}>
                                <Tooltip title="View Role Details & Permissions" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setRoleDetailState({ open: true, role: r })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#2563EB',
                                      bgcolor: '#EFF6FF',
                                      border: '1px solid #BFDBFE',
                                      '&:hover': { bgcolor: '#DBEAFE' },
                                    }}
                                  >
                                    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Edit Role Profile" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => setRoleFormState({ open: true, role: r })}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      color: '#166534',
                                      bgcolor: '#F0FDF4',
                                      border: '1px solid #BBF7D0',
                                      '&:hover': { bgcolor: '#DCFCE7' },
                                    }}
                                  >
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                {isSystem ? (
                                  <Tooltip title="Core System Role (Protected)" arrow>
                                    <span>
                                      <IconButton size="small" disabled sx={{ width: 30, height: 30, opacity: 0.4 }}>
                                        <LockOutlinedIcon sx={{ fontSize: 15 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete Role Master" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => setRoleDeleteState({ open: true, role: r, error: undefined })}
                                      sx={{
                                        width: 30,
                                        height: 30,
                                        color: '#DC2626',
                                        bgcolor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        '&:hover': { bgcolor: '#FEE2E2' },
                                      }}
                                    >
                                      <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* VIEW MODAL (ALL MASTERS) */}
      <MasterDetailModal
        open={viewState.open}
        type={viewState.type}
        data={viewState.data}
        onClose={() => setViewState((prev) => ({ ...prev, open: false }))}
        onEdit={() => {
          const { type, data } = viewState;
          setViewState((prev) => ({ ...prev, open: false }));
          openEdit(type, data);
        }}
        onDelete={() => {
          const { type, data } = viewState;
          setViewState((prev) => ({ ...prev, open: false }));
          openDelete(type, data);
        }}
      />

      {/* EDIT MODAL (ALL MASTERS) */}
      <MasterEditModal
        open={editState.open}
        type={editState.type}
        data={editState.data}
        units={units}
        employees={employees}
        productionUnits={productionUnits}
        onClose={() => setEditState((prev) => ({ ...prev, open: false }))}
      />


      {/* DELETE CONFIRMATION DIALOG (ALL MASTERS) */}
      <Dialog
        open={deleteState.open}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteState((prev) => ({ ...prev, open: false, error: undefined }));
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this master record?
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: '#FEF2F2',
                border: '1px solid #FECACA',
              }}
            >
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5, textTransform: 'uppercase' }}>
                {deleteState.type.replace('_', ' ')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {getDeleteItemLabel()}
              </Typography>
            </Box>
            {deleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {deleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Note: Master records referenced in existing stock, receipts, or transactions cannot be deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteState((prev) => ({ ...prev, open: false, error: undefined }))}
            color="inherit"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* EMPLOYEE DETAIL VIEW MODAL */}
      <EmployeeDetailModal
        open={employeeDetailState.open}
        employee={employeeDetailState.employee}
        onClose={() => setEmployeeDetailState({ open: false, employee: null })}
        onEdit={(emp) => {
          setEmployeeDetailState({ open: false, employee: null });
          setEmployeeFormState({ open: true, employee: emp });
        }}
        onDelete={(emp) => {
          setEmployeeDetailState({ open: false, employee: null });
          setEmployeeDeleteState({ open: true, employee: emp, error: undefined });
        }}
      />

      {/* EMPLOYEE FORM MODAL (ADD / EDIT) */}
      <EmployeeFormModal
        open={employeeFormState.open}
        employee={employeeFormState.employee}
        onClose={() => setEmployeeFormState({ open: false, employee: null })}
      />

      {/* EMPLOYEE DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={employeeDeleteState.open}
        onClose={() => {
          if (!deleteEmployeeMutation.isPending) {
            setEmployeeDeleteState({ open: false, employee: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm Employee Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this employee from the workforce master?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                EMPLOYEE MASTER
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {employeeDeleteState.employee?.employee_code} - {employeeDeleteState.employee?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 0.3 }}>
                {employeeDeleteState.employee?.designation_name} • {employeeDeleteState.employee?.department_name}
              </Typography>
            </Box>
            {employeeDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {employeeDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Note: Employees linked to active production batches, inward receipts, or operational records cannot be deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setEmployeeDeleteState({ open: false, employee: null, error: undefined })}
            color="inherit"
            disabled={deleteEmployeeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (employeeDeleteState.employee?.id) {
                deleteEmployeeMutation.mutate(employeeDeleteState.employee.id);
              }
            }}
            disabled={deleteEmployeeMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteEmployeeMutation.isPending ? 'Deleting...' : 'Yes, Delete Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* USER DETAIL VIEW MODAL */}
      <UserDetailModal
        open={userDetailState.open}
        user={userDetailState.user}
        onClose={() => setUserDetailState({ open: false, user: null })}
        onEdit={(u) => {
          setUserDetailState({ open: false, user: null });
          setUserFormState({ open: true, user: u });
        }}
        onDelete={(u) => {
          setUserDetailState({ open: false, user: null });
          setUserDeleteState({ open: true, user: u, error: undefined });
        }}
        isCurrentUser={currentUser?.id === userDetailState.user?.id}
      />

      {/* USER FORM MODAL (CREATE / EDIT) */}
      <UserFormModal
        open={userFormState.open}
        user={userFormState.user}
        onClose={() => setUserFormState({ open: false, user: null })}
      />

      {/* USER DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={userDeleteState.open}
        onClose={() => {
          if (!deleteUserMutation.isPending) {
            setUserDeleteState({ open: false, user: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm User Account Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this user account from the system?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                USER ACCOUNT
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {userDeleteState.user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: '#7F1D1D', display: 'block', mt: 0.3 }}>
                Username: @{userDeleteState.user?.username} {userDeleteState.user?.full_name ? `• ${userDeleteState.user.full_name}` : ''}
              </Typography>
            </Box>
            {userDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {userDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Warning: Deleting this user account will revoke access tokens, delete active sessions, and remove role assignments.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setUserDeleteState({ open: false, user: null, error: undefined })}
            color="inherit"
            disabled={deleteUserMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (userDeleteState.user?.id) {
                deleteUserMutation.mutate(userDeleteState.user.id);
              }
            }}
            disabled={deleteUserMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteUserMutation.isPending ? 'Deleting...' : 'Yes, Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ROLE DETAIL VIEW MODAL */}
      <RoleDetailModal
        open={roleDetailState.open}
        role={roleDetailState.role}
        onClose={() => setRoleDetailState({ open: false, role: null })}
        onEdit={() => {
          const role = roleDetailState.role;
          setRoleDetailState({ open: false, role: null });
          setRoleFormState({ open: true, role });
        }}
        onDelete={() => {
          const role = roleDetailState.role;
          setRoleDetailState({ open: false, role: null });
          setRoleDeleteState({ open: true, role, error: undefined });
        }}
      />

      {/* ROLE FORM MODAL (ADD / EDIT) */}
      <RoleFormModal
        open={roleFormState.open}
        role={roleFormState.role}
        onClose={() => setRoleFormState({ open: false, role: null })}
      />

      {/* ROLE DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={roleDeleteState.open}
        onClose={() => {
          if (!deleteRoleMutation.isPending) {
            setRoleDeleteState({ open: false, role: null, error: undefined });
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#DC2626', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlineRoundedIcon sx={{ color: '#DC2626' }} />
          Confirm Role Deletion
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>
              Are you sure you want to delete this role from Role Master?
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <Typography variant="caption" sx={{ color: '#991B1B', fontWeight: 600, display: 'block', mb: 0.5 }}>
                ROLE MASTER
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#991B1B' }}>
                {roleDeleteState.role?.code} - {roleDeleteState.role?.name}
              </Typography>
            </Box>
            {roleDeleteState.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {roleDeleteState.error}
              </Alert>
            )}
            <Typography variant="caption" sx={{ color: '#6B7280' }}>
              Note: Roles currently assigned to active employees or login users cannot be deleted.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setRoleDeleteState({ open: false, role: null, error: undefined })}
            color="inherit"
            disabled={deleteRoleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (roleDeleteState.role?.id) {
                deleteRoleMutation.mutate(roleDeleteState.role.id);
              }
            }}
            disabled={deleteRoleMutation.isPending}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 600 }}
          >
            {deleteRoleMutation.isPending ? 'Deleting...' : 'Yes, Delete Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD RAW / PACKING MATERIAL DIALOG */}
      <Dialog open={matOpen} onClose={() => setMatOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Raw / Packing Material</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Material Code"
                value={matCode || nextMatCode || ''}
                disabled
                helperText="Auto-generated unique ID (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Material Type"
                value={matType}
                onChange={(e) => setMatType(e.target.value)}
              >
                <MenuItem value="RAW_MATERIAL">Raw Material</MenuItem>
                <MenuItem value="PACKING_MATERIAL">Packing Material</MenuItem>
                <MenuItem value="CONSUMABLE">Consumable</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Material Name"
              required
              placeholder="e.g. 500g Plastic Outer Cover"
              value={matName}
              onChange={(e) => setMatName(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Specifications / Description"
              value={matDesc}
              onChange={(e) => setMatDesc(e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Unit of Measurement"
                required
                value={matUnit}
                onChange={(e) => setMatUnit(e.target.value)}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Minimum Stock Threshold"
                value={matMin}
                onChange={(e) => setMatMin(parseFloat(e.target.value) || 0)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setMatOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!matName || !matUnit || createMaterialMutation.isPending}
            onClick={() => createMaterialMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createMaterialMutation.isPending ? 'Saving...' : 'Add Material'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD FINISHED GOODS PRODUCT DIALOG */}
      <Dialog open={prodOpen} onClose={() => setProdOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Finished Goods Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Product Code"
                value={prodCode || nextProdCode || ''}
                disabled
                helperText="Auto-generated unique ID (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Category"
                value={prodCat}
                onChange={(e) => setProdCat(e.target.value)}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Product Name"
              required
              placeholder="e.g. Royal Chandan Incense Sticks (100g)"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Description"
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Cost Price (₹)"
                value={prodCost}
                onChange={(e) => setProdCost(parseFloat(e.target.value) || 0)}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Selling Price / MRP (₹)"
                value={prodSelling}
                onChange={(e) => setProdSelling(parseFloat(e.target.value) || 0)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Unit of Measurement"
                required
                value={prodUnit}
                onChange={(e) => setProdUnit(e.target.value)}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Minimum Stock Level"
                value={prodMin}
                onChange={(e) => setProdMin(parseFloat(e.target.value) || 0)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProdOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!prodName || !prodUnit || createProductMutation.isPending}
            onClick={() => createProductMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createProductMutation.isPending ? 'Saving...' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD VENDOR SUPPLIER DIALOG */}
      <Dialog open={venOpen} onClose={() => setVenOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Vendor Supplier</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Vendor Code"
                value={venCode || nextVenCode || ''}
                disabled
                helperText="Auto-generated unique ID (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                fullWidth
                size="small"
                label="Contact Person"
                value={venContact}
                onChange={(e) => setVenContact(e.target.value)}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Supplier Company Name"
              required
              placeholder="e.g. South Indian Perfumers Pvt Ltd"
              value={venName}
              onChange={(e) => setVenName(e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                required
                value={venPhone}
                onChange={(e) => setVenPhone(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                value={venEmail}
                onChange={(e) => setVenEmail(e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="GSTIN Number"
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={venGst}
                onChange={(e) => setVenGst(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Tax Number / CST"
                value={venTax}
                onChange={(e) => setVenTax(e.target.value)}
              />
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Physical Address"
              value={venAddress}
              onChange={(e) => setVenAddress(e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={venCity}
                onChange={(e) => setVenCity(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="State"
                value={venState}
                onChange={(e) => setVenState(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setVenOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!venName || !venPhone || createVendorMutation.isPending}
            onClick={() => createVendorMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createVendorMutation.isPending ? 'Saving...' : 'Add Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD CUSTOMER / DEALER DIALOG */}
      <Dialog open={custOpen} onClose={() => setCustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Dealer / Customer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Customer Code"
                value={custCode || nextCustCode || ''}
                disabled
                helperText="Auto-generated unique ID (Read-only)"
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#EFF6FF', color: '#2563EB', fontWeight: 700 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                select
                fullWidth
                size="small"
                label="Customer Type"
                value={custType}
                onChange={(e) => setCustType(e.target.value as any)}
              >
                <MenuItem value="DEALER">Dealer</MenuItem>
                <MenuItem value="WHOLESALER">Wholesaler</MenuItem>
                <MenuItem value="RETAILER">Retailer</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Customer / Business Name"
              required
              placeholder="e.g. Lakshmi Pooja Stores"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Contact Person"
                value={custContact}
                onChange={(e) => setCustContact(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                required
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="GSTIN Number"
                value={custGst}
                onChange={(e) => setCustGst(e.target.value)}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="City"
                value={custCity}
                onChange={(e) => setCustCity(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="State"
                value={custState}
                onChange={(e) => setCustState(e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Credit Limit (₹)"
                value={custCredit}
                onChange={(e) => setCustCredit(parseFloat(e.target.value) || 0)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCustOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!custName || !custPhone || createCustomerMutation.isPending}
            onClick={() => createCustomerMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createCustomerMutation.isPending ? 'Saving...' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD UNIT DIALOG */}
      <Dialog open={unitOpen} onClose={() => setUnitOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Unit of Measurement (UOM)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Unit Code"
              value={unitCode || nextUnitCode || ''}
              disabled
              helperText="Auto-generated unique ID (Read-only)"
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#ECFEFF', color: '#0891B2', fontWeight: 700 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Unit Name"
              required
              placeholder="e.g. Bundle, Roll, Canister"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label="Symbol / Abbreviation"
              placeholder="e.g. bdl, rll, can"
              value={unitSymbol}
              onChange={(e) => setUnitSymbol(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setUnitOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!unitName || createUnitMutation.isPending}
            onClick={() => createUnitMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createUnitMutation.isPending ? 'Saving...' : 'Add Unit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD PRODUCTION UNIT DIALOG */}
      <Dialog open={puOpen} onClose={() => setPuOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Production Unit</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Production Unit Code"
              value={puCode || nextPuCode || ''}
              disabled
              helperText="Auto-generated unique ID (Read-only)"
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 700 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              size="small"
              label="Unit Name"
              required
              placeholder="e.g. Production Unit C (Cartoning)"
              value={puName}
              onChange={(e) => setPuName(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label="Facility Description"
              placeholder="e.g. Automated cartoning and outer boxing facility"
              value={puDesc}
              onChange={(e) => setPuDesc(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label="Physical Address / Location"
              placeholder="e.g. Plot 43, Peenya Industrial Area, Bangalore"
              value={puAddress}
              onChange={(e) => setPuAddress(e.target.value)}
            />
            <TextField
              select
              fullWidth
              size="small"
              label="Assigned Plant Manager"
              value={puManager}
              onChange={(e) => setPuManager(e.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code} - {emp.designation_name || emp.department_name})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPuOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!puName || createProductionUnitMutation.isPending}
            onClick={() => createProductionUnitMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createProductionUnitMutation.isPending ? 'Saving...' : 'Add Production Unit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD WAREHOUSE DIALOG */}
      <Dialog open={whOpen} onClose={() => setWhOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Warehouse Master</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Warehouse Code"
              value={whCode || nextWhCode || ''}
              disabled
              helperText="Auto-generated unique ID (Read-only)"
              slotProps={{
                input: {
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Chip icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />} label="AUTO ID" size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: '#F0FDFA', color: '#0D9488', fontWeight: 700 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Warehouse Name"
              required
              placeholder="e.g. Peenya Central Raw Materials Godown"
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Warehouse Manager"
              value={whManager}
              onChange={(e) => setWhManager(e.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code} - {emp.designation_name || emp.department_name})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              label="Address"
              placeholder="e.g. Plot 44, 2nd Stage, Peenya Industrial Area, Bangalore"
              value={whAddress}
              onChange={(e) => setWhAddress(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setWhOpen(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={!whName || createWarehouseMutation.isPending}
            onClick={() => createWarehouseMutation.mutate()}
            sx={{ bgcolor: '#14532D', '&:hover': { bgcolor: '#0B3B1F' } }}
          >
            {createWarehouseMutation.isPending ? 'Saving...' : 'Add Warehouse'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

