# Assetly - Stakeholder Roles, Responsibilities & Workflow Matrix

This document provides a comprehensive breakdown of each stakeholder role in **Assetly**, detailing their responsibilities, accessible features, step-by-step operational workflows, and security permission scopes.

---

## 👥 Overview of Stakeholders

Assetly categorizes users into **5 distinct stakeholder roles**:

1. **Admin** *(System & Organization Administrator)*
2. **Supervisor** *(Zone Operations & Work Order Manager)*
3. **Engineer** *(Field Asset & Maintenance Engineer)*
4. **Auditor** *(Compliance & Financial Auditor)*
5. **Citizen** *(Public Resident & Grievance Reporter)*

---

## 📊 Stakeholder Quick Reference Matrix

| Feature / Action | Admin | Supervisor | Engineer | Auditor | Citizen |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Portal Access** | Internal (`/`) | Internal (`/`) | Internal (`/`) | Internal (`/`) | Public (`/report`) |
| **Invite Staff Users** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Assign Roles & Zones** | ✅ Yes | ❌ No | ❌ No | ❌ No | ❌ No |
| **Manage Wards/Zones** | ✅ Full Org | ❌ Read Only | ❌ Read Only | ❌ Read Only | ❌ No Access |
| **Manage Categories & Specs** | ✅ Full Org | ❌ Read Only | ❌ Read Only | ❌ Read Only | ❌ No Access |
| **Asset Creation & Edits** | ✅ Full Org | 🟡 Zone Only | 🟡 Zone Scope | 👁️ Read Only | 🌐 Public QR View |
| **Log Asset Inspections** | ✅ Full Org | 🟡 Zone Only | 🟡 Zone Scope | 👁️ Read Only | ❌ No Access |
| **Create Work Orders** | ✅ Full Org | 🟡 Zone Only | 🟡 Zone Scope | 👁️ Read Only | ❌ No Access |
| **Assign Work Orders** | ✅ Full Org | 🟡 Zone Only | ❌ No | 👁️ Read Only | ❌ No Access |
| **Execute & Complete Work Orders** | ✅ Full Org | 🟡 Zone Only | 🟢 Assigned Only | 👁️ Read Only | ❌ No Access |
| **Triage Citizen Reports** | ✅ Full Org | 🟡 Zone Only | 🟡 Zone Scope | 👁️ Read Only | ❌ No Access |
| **Submit Public Grievance** | ❌ Internal | ❌ Internal | ❌ Internal | ❌ Internal | ✅ Yes |
| **View Audit Logs** | ✅ Full Org | ❌ No Access | ❌ No Access | ✅ Full Org | ❌ No Access |

---

## 🔍 Detailed Stakeholder Breakdowns & Workflows

---

### 1. 👑 Admin (System & Organization Administrator)

#### Primary Responsibilities
The Admin is responsible for executive oversight, user onboarding, role-based authorization, infrastructure category definitions, and system security.

#### Key Tasks & Accessible Features
- **User Invitation & Account Issuance**: Invite internal staff members (`Supervisor`, `Engineer`, `Auditor`), set role assignments, and assign physical wards/zones.
- **Organization Governance**: Deactivate accounts, modify user zone assignments, and maintain active admin quotas.
- **Asset Categories & Specs**: Create and manage asset categories (e.g., Streetlights, Drains, Roads, Pipelines) along with their dynamic technical specifications and inspection intervals.
- **Ward & Zone Administration**: Create new geographical zones/wards, assign codes, and define boundaries.
- **Audit & Compliance Logging**: Access system-wide immutable security audit logs to track every user action, status change, and system event.

#### Step-by-Step Admin Workflow
1. **Onboarding Staff**:
   - Navigate to `Admin` ➔ `Users`.
   - Click **Invite User**.
   - Enter Full Name, Email Address, Select Role (`Engineer`, `Supervisor`, `Auditor`), and select assigned Wards/Zones.
   - Click **Send Invitation & Credentials** to automatically generate a secure initial password and dispatch invitation emails via SMTP.
2. **Category Setup**:
   - Navigate to `Admin` ➔ `Categories`.
   - Define asset category schemas, default life expectancies (years), inspection schedules, and custom specification fields.
3. **Audit Oversight**:
   - Navigate to `Admin` ➔ `Audit Log`.
   - Review system actions, track security events, failed login attempts, and status change timestamps.

---

### 2. 👔 Supervisor (Zone Operations Manager)

#### Primary Responsibilities
The Supervisor manages daily municipal asset operations, oversees assigned wards/zones, triages citizen grievance reports, and allocates work orders to field engineers.

#### Key Tasks & Accessible Features
- **Zone Asset Oversight**: View health scores, maintenance schedules, and active issues across assigned zones.
- **Citizen Report Triage**: Review incoming citizen complaints, match complaints to physical assets, and convert complaints into formal work orders.
- **Work Order Management**: Create, prioritize (`urgent`, `high`, `medium`, `low`), assign, update, and cancel work orders for field engineers.
- **Zone Maintenance Analytics**: Monitor open versus completed work order ratios and track zone performance metrics.

#### Step-by-Step Supervisor Workflow
1. **Triage Citizen Complaints**:
   - Navigate to `Staff Reports` (`/reports/staff`).
   - Review citizen grievance submissions originating within assigned zones.
   - Click **Match Asset** to link the complaint to the nearest physical infrastructure asset.
2. **Work Order Dispatch**:
   - Navigate to `Work Orders Board` (`/work-orders`).
   - Click **Create Work Order**.
   - Select the target asset, enter title/description, assign priority level, set due date, and select an assigned Field Engineer.
3. **Operations Monitoring**:
   - Track live maintenance progress on the Kanban Work Orders Board (`Open` ➔ `Assigned` ➔ `In Progress` ➔ `Completed`).

---

### 3. 🛠️ Engineer (Field Asset & Maintenance Engineer)

#### Primary Responsibilities
Field Engineers operate directly on physical infrastructure assets within their assigned zone(s). They register new assets, conduct routine or emergency field inspections, utilize AI vision damage detection, and execute assigned work orders.

#### Key Tasks & Accessible Features
- **Asset Registration**: Register new infrastructure assets with GPS coordinates, street addresses, acquisition costs, photos, and category specs.
- **QR Code Scanning**: Scan physical QR codes installed on assets via mobile/tablet to instantly view history, health score, and past maintenance.
- **Field Inspections & AI Detection**: Log asset inspection ratings (1 to 5 stars), upload photos, and run automated AI damage detection (identifying cracks, corrosion, structural wear, severity ratings).
- **Work Order Execution**: Complete assigned maintenance work orders, record actual maintenance costs, and update asset operational status (`in_service`, `under_maintenance`, `installed`).

#### Step-by-Step Engineer Workflow
1. **Asset Onboarding**:
   - Navigate to `Assets` ➔ `Register New Asset` (`/assets/new`).
   - Use **Auto GPS** to capture exact location coordinates.
   - Enter asset name, category, assigned ward, photo attachment, and category-specific parameters.
   - Click **Save & Generate QR Code**.
2. **Logging Field Inspection**:
   - Scan QR code or search asset on `Asset Detail` page (`/assets/:id`).
   - Click **Log Inspection**.
   - Select condition rating, enter inspection notes, upload asset photo for AI analysis, and submit.
3. **Executing Assigned Maintenance**:
   - Navigate to `Work Orders` (`/work-orders`).
   - Filter by **My Assigned Orders**.
   - Update status to `In Progress` while performing repairs.
   - Upon repair completion, enter actual cost incurred and click **Mark Completed**.

---

### 4. 📈 Auditor (Compliance & Financial Auditor)

#### Primary Responsibilities
The Auditor maintains organization-wide read-only access to audit governance, financial expenditures, asset depreciation, asset lifecycles, and compliance metrics.

#### Key Tasks & Accessible Features
- **Organization-Wide Read Access**: Inspect all assets, zones, categories, inspections, and work orders across the entire authority (no zone restrictions).
- **Financial & Lifespan Tracking**: Monitor acquisition costs, maintenance expenses, calculated health scores, and asset depreciation timelines.
- **Compliance Audit Logs**: Access system audit trails to verify regulatory compliance, inspect event timelines, and review historic activity.
- **Read-Only Protection**: The Auditor role is strictly read-only and cannot create, modify, or delete database records.

#### Step-by-Step Auditor Workflow
1. **Health & Risk Audit**:
   - Open `Dashboard` (`/`) and `Asset List` (`/assets`).
   - Filter assets by health status (`Critical`, `High Risk`, `Watch`, `Healthy`).
   - Review high-risk infrastructure requiring mandatory preventive maintenance.
2. **Financial Verification**:
   - Inspect individual asset lifecycles, purchase dates, initial acquisition costs versus ongoing work order maintenance expenses.
3. **Audit Trail Review**:
   - Open `Admin` ➔ `Audit Log` (`/admin/audit`).
   - Verify timestamped audit logs for compliance reporting.

---

### 5. 🌐 Citizen (Public Resident / Grievance Reporter)

#### Primary Responsibilities
Citizens represent the public community. They report damaged or faulty public infrastructure (e.g., broken streetlights, road potholes, clogged drains) and track the resolution status of their submitted complaints.

#### Key Tasks & Accessible Features
- **Public Grievance Portal**: Access public report page (`/report`) without needing internal staff credentials.
- **Issue Submission**: Report damaged infrastructure by capturing GPS location, describing the problem, and attaching site photos.
- **Tracking Code Verification**: Receive a unique tracking code (e.g., `R-CR0012`) to check live progress (`Received`, `Matched`, `Work Order Created`, `Resolved`).
- **Public QR Inspection**: Scan any public QR code installed on municipal infrastructure (`/a/:assetCode`) to view public health status, installation year, and asset code without accessing internal financial or staff data.

#### Step-by-Step Citizen Workflow
1. **Filing a Grievance**:
   - Visit `http://localhost:5173/report`.
   - Click **Auto-Detect GPS Location** or select map location.
   - Enter contact email, describe the defect (e.g. *"Pot hole near junction"*), attach a photo, and click **Submit Report**.
2. **Tracking Progress**:
   - Copy the generated tracking code.
   - Visit `/report/:code` at any time to view real-time update status as municipal staff inspect and resolve the issue.

---

## 🔒 Summary Matrix of Route & Endpoint Access Controls

| URL Route | Admin | Supervisor | Engineer | Auditor | Citizen |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/` *(Dashboard)* | ✅ | ✅ | ✅ | ✅ | ❌ |
| `/assets` *(Asset List)* | ✅ | 🟡 Zone | 🟡 Zone | ✅ Org | ❌ |
| `/assets/new` *(Create Asset)* | ✅ | 🟡 Zone | 🟡 Zone | ❌ | ❌ |
| `/work-orders` *(Work Orders Board)* | ✅ | 🟡 Zone | 🟡 Zone | ✅ Org | ❌ |
| `/reports/staff` *(Staff Triage)* | ✅ | 🟡 Zone | 🟡 Zone | ✅ Org | ❌ |
| `/admin/users` *(User Management)* | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/zones` *(Ward Management)* | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/categories` *(Category Specs)* | ✅ | ❌ | ❌ | ❌ | ❌ |
| `/admin/audit` *(Audit Trail)* | ✅ | ❌ | ❌ | ✅ | ❌ |
| `/report` *(Public Grievance Portal)* | 🌐 Public | 🌐 Public | 🌐 Public | 🌐 Public | ✅ Primary |
| `/a/:assetCode` *(Public QR Page)* | 🌐 Public | 🌐 Public | 🌐 Public | 🌐 Public | 🌐 Public |
