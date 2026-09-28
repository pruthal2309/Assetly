# 🏙️ Assetly — Smart Infrastructure Asset Management Platform

> A role-based, department-aware infrastructure management system for municipal bodies.
> Manage assets, work orders, inspections, citizen grievances, and audit trails — all in one place.

---

## 🔗 Live Deployments

| Service  | URL |
|----------|-----|
| **Frontend** | https://assetly-smoky.vercel.app |
| **Backend API** | https://assetly-d2g4.onrender.com |
| **API Health** | https://assetly-d2g4.onrender.com/healthz |

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6, Zustand, Axios |
| Backend | Node.js, Express.js, MongoDB + Mongoose |
| Auth | JWT Access Token + Refresh Token (httpOnly cookie) |
| Storage | Local disk (`/uploads`) via Multer |
| Email | Nodemailer (Gmail SMTP) |
| Deployment | Vercel (Frontend) · Render (Backend) · MongoDB Atlas (DB) |

---

## 👥 Stakeholders & Roles (5 Total)

| # | Role | Scope | Demo Email | Demo Password |
|---|------|-------|------------|---------------|
| 1 | **Admin** | Organization-wide | `admin@demo.com` | `Admin@123` |
| 2 | **Supervisor** | Zone & Department level | `supervisor@demo.com` | `Super@123` |
| 3 | **Engineer** | Field execution | `engineer@demo.com` | `Engineer@123` |
| 4 | **Auditor** | Read-only audit & reports | `auditor@demo.com` | `Audit@123` |
| 5 | **Citizen** | Public grievance portal | `citizen@demo.com` | `Citizen@123` |

> **One-click login**: On the login page, click any role card to sign in instantly without typing.

---

## 🏗️ Organizational Hierarchy

```
Organization
  └── Department (Water Supply, Roads, Drainage, Electrical, Public Buildings)
        └── Category (Streetlight, Road Segment, Bridge, Pipeline, Drain, Building)
              └── Zone / Ward (5 wards)
                    └── Asset (500 seeded assets)
                          └── Work Order / Inspection
```

---

## 🗺️ Seeded Data (Demo Database)

| Entity | Count |
|--------|-------|
| Organization | 1 — Demo City Infrastructure Management Authority |
| Departments | 5 |
| Categories | 6 |
| Zones / Wards | 5 |
| Assets | 500 |
| Work Orders | 70 |
| Citizen Reports | 12 |
| Demo Users | 5 (one per role) |

### Departments & Categories

| Department | Code | Categories |
|------------|------|-----------|
| Water Supply | WAT | Water Pipeline |
| Roads & Transportation | RDTR | Road Segment, Bridge / Flyover |
| Drainage | DRN | Drainage Channel |
| Electrical | ELEC | Streetlight |
| Public Buildings | BLDG | Public Building |

---

## 🔐 Role-Based Permissions & Tasks

### 1. Admin
- Invite staff (Supervisor, Engineer, Auditor) via email
- Manage Departments — create, edit, assign categories / zones / personnel
- View all zones, assets, categories across the organization
- Monitor all work orders and inspections
- Access audit logs for every action in the system
- View organization-wide dashboard & KPIs

### 2. Supervisor
- Manage assets within assigned zones & departments
- Create Work Orders with title, asset, priority, due date
- Assign work orders to Engineers within the same zone & department
- Review and update work order status
- Create and schedule Inspections
- View zone-level dashboard

### 3. Engineer
- View work orders assigned to them
- Update work order status: `open → in_progress → completed`
- Upload media (photos/videos) to work orders
- Conduct inspections and submit inspection results
- Receive in-app notifications when a work order is assigned

### 4. Auditor
- Read-only access to all assets, work orders, inspections
- View full audit log with filters
- Export & review citizen reports and grievance timelines

### 5. Citizen
- Submit infrastructure grievance reports (location-based)
- Department is auto-routed based on nearest asset — citizen never selects manually
- Track report status and resolution
- Receive updates on their submitted reports

---

## 🔄 Work Order Lifecycle

```
Created (open)
  → Assigned to Engineer (assigned)
    → Engineer starts work (in_progress)
      → Engineer marks complete (completed)
      OR Supervisor cancels (cancelled)
```

---

## 🔔 Notification System

- When a Supervisor creates a Work Order → **all Engineers in that zone get a notification**
- Notifications visible in the Engineer's sidebar & notification panel

---

## 🗺️ Citizen Report Routing

1. Citizen submits report with location
2. System finds the nearest Asset within 50m
3. Department is derived from that Asset's Category
4. A Work Order is auto-created and routed to the correct Department
5. Supervisor of that Department reviews and assigns an Engineer

---

## 📁 Project Structure

```
Assetly/
├── Frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── app/            # Router, Layout, global styles
│   │   ├── features/       # Auth, Admin, Supervisor, Engineer, Citizen pages
│   │   └── shared/         # API client, UI components, hooks
│   ├── .env                # VITE_API_BASE, VITE_API_URL
│   └── vercel.json         # SPA fallback routing for Vercel
│
└── Backend/                # Express.js REST API
    ├── src/
    │   ├── config/         # env.js, db connect
    │   ├── middleware/      # auth, RBAC, rate limit, error handler
    │   ├── models/         # Mongoose schemas
    │   ├── modules/        # auth, users, zones, departments, categories,
    │   │                   # assets, inspections, workorders, reports,
    │   │                   # media, dashboard, audit, ai
    │   └── scripts/        # seed.js (run to reset demo data)
    └── .env                # All backend environment variables
```

---

## ⚙️ Environment Variables

### Backend (`Backend/.env`)

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=<your-atlas-uri>
JWT_ACCESS_SECRET=<secret>
JWT_ACCESS_TTL=15m
REFRESH_TTL_DAYS=7
CORS_ORIGINS=http://localhost:5173,https://assetly-smoky.vercel.app
PUBLIC_BASE_URL=https://assetly-d2g4.onrender.com
APP_URL=https://assetly-smoky.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=<gmail>
EMAIL_PASSWORD=<app-password>
```

### Frontend (`Frontend/.env`)

```env
VITE_API_BASE=https://assetly-d2g4.onrender.com/api/v1
VITE_API_URL=https://assetly-d2g4.onrender.com
```

> **Important for Render**: Set all backend env vars manually in the Render Dashboard → Environment tab. Render does not read `.env` from Git.

---

## 🚀 Running Locally

### Backend
```bash
cd Backend
npm install
npm run dev        # starts on http://localhost:8000
```

### Frontend
```bash
cd Frontend
npm install
npm run dev        # starts on http://localhost:5173
```

### Re-seed the database
```bash
cd Backend
node src/scripts/seed.js
```
> ⚠️ This **wipes all data** and re-seeds 500 assets, 70 work orders, 12 reports, and 5 demo users.

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/dashboard` | Role-scoped dashboard stats |
| GET | `/api/v1/assets` | List assets |
| GET | `/api/v1/work-orders` | List work orders |
| POST | `/api/v1/work-orders` | Create work order (Supervisor) |
| PATCH | `/api/v1/work-orders/:id` | Update work order |
| GET | `/api/v1/departments` | List departments (Admin) |
| POST | `/api/v1/departments` | Create department (Admin) |
| POST | `/api/v1/reports` | Submit citizen report |
| GET | `/api/v1/audit` | Audit logs (Admin/Auditor) |
| POST | `/api/v1/users/invite` | Invite staff member (Admin) |

---

## 🧪 Test Accounts Quick Reference

```
Admin      → admin@demo.com       / Admin@123
Supervisor → supervisor@demo.com  / Super@123
Engineer   → engineer@demo.com    / Engineer@123
Auditor    → auditor@demo.com     / Audit@123
Citizen    → citizen@demo.com     / Citizen@123
```
