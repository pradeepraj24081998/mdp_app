# AromaCraft ERP — Startup Inventory, Purchase, Production & Sales Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-red.svg)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-19.2%20%7C%20TypeScript-61DAFB.svg)](https://react.dev/)
[![MUI](https://img.shields.io/badge/MUI-v9%20Light%20Theme-007FFF.svg)](https://mui.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

A production-ready, modular-monolith Enterprise Resource Planning (ERP) platform built for manufacturing and trading businesses (demonstrated via an incense, fragrance, and raw material enterprise). 

Engineered with strict enterprise architecture principles: centralized double-entry stock ledger, row-level locking, user vs employee operational separation, multi-tier purchase approvals, automated sequential document numbering, and clean light-themed Material UI interface.

---

## 🏛️ Architectural Highlights

```text
React 19 + TypeScript + MUI Light Theme (Vite)
                     ↓  (Axios + SimpleJWT Bearer with Auto-Refresh)
Django REST API (Modular Monolith: 13 Domain Apps)
         ├── DocumentNumberService (Concurrency-Safe Locks)
         ├── InventoryService (Centralized Stock Engine)
         └── AuditLog Middleware & Workflow State Machines
                     ↓
PostgreSQL 16 (Row-Level Locking on StockBalance, UUID Primary Keys)
```

1. **Modular Monolith**: 13 domain-isolated Django apps (`accounts`, `employees`, `masters`, `planning`, `purchasing`, `shipping`, `inward`, `inventory`, `production`, `sales`, `reports`, `notifications`, `audit`).
2. **Centralized Inventory Service (`apps.inventory.services.InventoryService`)**:
   - Zero direct database updates from views/serializers.
   - All balance changes execute through double-entry ledger transactions (`StockTransaction`) and atomic row-locked balances (`StockBalance.objects.select_for_update()`).
   - Prevents race conditions and strictly rejects negative stock balances.
3. **Mandatory Separation of Concerns: `User` vs `Employee`**:
   - `accounts.User`: System authentication, JWT sessions, audit footprints (`created_by`, `approved_by`).
   - `employees.Employee`: Operational factory workforce (material handlers, drivers, quality inspectors, machine operators) who may or may not require application logins.
4. **Gate Inward != Usable Stock**:
   - Inward goods arrival generates gate receipts.
   - Material undergoes rigorous Quality Verification (`apps.inward`). Only accepted/passed quantities enter active inventory. Damaged items are quarantined for vendor credit notes or replacement requests.
5. **Tiered Purchase Approvals**:
   - Automatic routing based on purchase value (orders `< ₹50,000` require Manager sign-off; orders `≥ ₹50,000` enforce dual Manager + Admin approval).
6. **Exclusive Light Theme**:
   - Hand-crafted, modern SaaS aesthetic with Inter typography, 8px grid alignment, and subtle Slate borders.

---

## 📁 Repository Structure

```text
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Custom User model, JWT auth, RBAC permissions
│   │   ├── employees/      # Workforce, departments, designations
│   │   ├── masters/        # Materials, Units, Vendors, Products, Customers, Production Units
│   │   ├── planning/       # Material requirement planning & approval workflows
│   │   ├── purchasing/     # Purchase Orders, multi-tier approvals, vendor items
│   │   ├── shipping/       # Transporters, LR tracking, vehicle dispatch
│   │   ├── inward/         # Gate receiving, material quality verification & rejection
│   │   ├── inventory/      # Centralized InventoryService, StockLedger, OpeningStock
│   │   ├── production/     # Production orders, BOM issue, consumption, finished goods
│   │   ├── sales/          # Sales orders, GST invoicing, wholesale fulfillment, returns
│   │   ├── reports/        # BI aggregation, Excel/CSV exports, stock valuation
│   │   ├── notifications/  # Notification center, alert triggers
│   │   └── audit/          # Immutably recorded system audit logs
│   ├── common/             # BaseModel (UUID PK, soft deletion, timestamps, user tracking)
│   ├── config/             # Django settings, WSGI, ASGI, URL routing
│   ├── requirements/       # base.txt, local.txt, production.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios client with JWT refresh token interceptor
│   │   ├── components/     # AppLayout, AppHeader, AppSidebar, StatCard, GlobalSearchModal
│   │   ├── context/        # AuthContext for session management
│   │   ├── features/       # Feature-based pages (Purchasing, Inward, Inventory, Production, Sales, etc.)
│   │   ├── theme/          # Custom Light MUI theme with Inter font
│   │   └── types/          # TypeScript domain interfaces
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml       # Production stack: Postgres 16, Redis, Backend, Celery, Frontend
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
* Python 3.11+
* Node.js 20+ & npm
* PostgreSQL (or use built-in SQLite auto-fallback for local development)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements/base.txt

# Run migrations
python manage.py migrate

# Seed database with realistic demo data (Users, Employees, Materials, Products, Vendors, Stock)
python manage.py seed_data

# Start Django development server
python manage.py runserver 8000
```
* Backend API available at: `http://localhost:8000/api/v1/`
* Swagger OpenAPI Docs: `http://localhost:8000/api/docs/`
* Django Admin: `http://localhost:8000/admin/`

---

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
* Open your browser at: `http://localhost:5173/`

---

## 🔑 Pre-Seeded Demo Credentials

All test accounts are pre-seeded with the password: `password123`

| Role | Username | Full Name | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | System Administrator | Full unconstrained platform control |
| **Operations Manager** | `manager` | Priya Sharma | High-level approvals, planning & reports |
| **Purchase Manager** | `purchase_mgr` | Rajesh Kumar | PO generation, vendor quotes, purchase approval |
| **Store Manager** | `store_mgr` | Vikram Singh | Gate inward receipts, verification & stock dispatch |
| **Production Manager** | `prod_mgr` | Anita Desai | Production orders, BOM consumption & QC output |
| **Sales Manager** | `sales_mgr` | Suresh Patel | Sales orders, customer credit, invoicing & returns |
| **Accountant** | `accountant` | Meera Nair | Invoices, payment records & audit reviews |

---

## ⚙️ Docker Production Deployment

To run the complete production environment (PostgreSQL 16, Redis, Gunicorn Backend, Celery, and Nginx-served Frontend):

```bash
# In the project root:
docker-compose up --build -d
```

Services started:
* **Frontend SPA**: `http://localhost:3000` (or `http://localhost:80`)
* **Backend REST API**: `http://localhost:8000/api/v1/`
* **PostgreSQL 16**: Port `5432`
* **Redis 7**: Port `6379`
* **Celery Worker**: Asynchronous queue processor

---

## 🧪 Running Automated Tests

```bash
cd backend
python manage.py test apps.inventory apps.purchasing apps.sales
```

---

## 📄 License
Proprietary — Developed for Startup Incense & Fragrance Manufacturing ERP Operations.
#   m d p _ a p p  
 