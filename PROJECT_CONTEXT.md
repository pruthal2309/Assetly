# Assetly Project Context & Progress Log

## Overview
Assetly is an infrastructure asset inventory and lifecycle management platform built with Node.js (Express + Mongoose) backend and React (Vite) frontend.

## Key Design Tokens & Architecture
- **Palette**: Deep Bluish (`#0D3A35`), Moderate Green (`#276152`), Laurel Green (`#B1B7AB`), Light Cream (`#FBF6F0`).
- **Health Colors**: Healthy (`#8FD3B0`), Watch (`#E6C36A`), High (`#E38B5F`), Critical (`#EF6A62`).
- **Typography**: Bricolage Grotesque (Headings), Figtree (Body).
- **Backend Port**: 8000
- **Frontend Port**: 5173 (Vite proxy: `/api` -> `http://localhost:8000`, `/uploads` -> `http://localhost:8000`)
- **Roles**: `admin`, `supervisor`, `engineer`, `auditor`, `citizen`

## Implementation Status

### Phase 1: Backend
- [x] Dependencies installation & `package.json` updates
- [x] Environment validation (`config/env.js`)
- [x] Folder structure & database connection (`db/connect.js`, `db/indexes.js`, `db/withTransaction.js`)
- [x] Models: `Organization`, `Zone`, `User`, `Session`, `Category`, `Asset`, `Inspection`, `WorkOrder`, `AssetEvent`, `Media`, `CitizenReport`, `AuditLog`, `Counter`, `Notification`
- [x] Common utilities & middleware: errors, permissions map, scope filter, pagination, sanitize, requestId, authenticate, authorize, validate, rateLimit, audit, errorHandler
- [x] Modules: `auth`, `users`, `zones`, `categories`, `assets` (lifecycle, health, code generation), `inspections`, `workorders`, `reports`, `media`, `dashboard`, `audit`, `ai`
- [x] Cron Jobs (`jobs/index.js`)
- [x] Seed script (`scripts/seed.js`)
- [x] Vitest backend tests (RBAC suite, lifecycle transitions, auth flow, transactions)

### Phase 2: Frontend
- [x] Frontend dependencies & Vite proxy setup
- [x] App routing, guards (`RequireAuth`, `RequirePermission`), Zustand auth store & axios interceptor
- [x] Glassmorphism design system & token CSS
- [x] Pages: Login, Dashboard, Map, Asset List, Asset Form, Asset Detail, Inspection Form, Work Orders Board & Drawer, Citizen Public Report & Status, QR Scanner, Admin Pages (Users, Zones, Categories, Audit Log), 403 & 404
- [x] Offline queue handling (IndexedDB)
- [x] Frontend unit & component tests (`npm run build` passing cleanly)

### Phase 3: Integration & Delivery
- [x] Root `package.json` & `docker-compose.yml`
- [x] Root `README.md` & `DEMO.md`
- [x] `.gitignore` setup

## Decisions Log
- ESM modules (`"type": "module"`) used across backend & frontend.
- MongoDB Atlas Cloud Cluster connected (`MONGODB_URI` set to `Assetly` database on `cluster0.n3adjiz.mongodb.net`).
- Transactions enabled (`USE_TRANSACTIONS=true`) utilizing Atlas native multi-document session transaction support.
- Fixed Express 5 `req.query` read-only getter bug in `sanitize` middleware (`cleanInPlace` in-place object mutation).
- Glassmorphism recipes and color tokens strictly follow `asset-inventory-ui.html`.
