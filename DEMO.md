# Assetly 5-Minute Demo Script

Follow this step-by-step click-through script during live demonstration using the seeded accounts.

---

## Step 1: Admin Overview & Executive Dashboard (45 Seconds)
1. Navigate to `http://localhost:5173/login`.
2. Click the quick-fill button **Admin** (`admin@demo.com` / `Admin@123`) and click **Sign In**.
3. View the Executive Dashboard:
   - Count-up animation on KPI Cards (Total Assets: 500, In Service, Under Maintenance, Overdue).
   - Maintenance Cost Trend Chart.
   - Condition Risk Breakdown.
   - High-Risk Assets list.

---

## Step 2: Engineer Asset Registration & GIS Map (60 Seconds)
1. Click **Sign Out** or open a new window to log in as **Engineer** (`engineer@demo.com` / `Engineer@123`).
2. Click **GIS Map** on the sidebar:
   - Observe dark-themed Leaflet map tiles with health-colored markers.
   - Click any marker (e.g. Critical red marker) -> Observe right glass detail panel with radial SVG HealthRing and LifecycleStepper.
3. Click **Add Asset** (`/assets/new`):
   - Click **Auto GPS** to populate coordinates.
   - Select **Category**: Streetlight -> Observe dynamic fields (Wattage, Pole Height).
   - Fill Asset Name: `MG Road Solar Streetlight 99` and click **Save & Generate QR**.
   - Observe auto-generated unique Asset Code (e.g., `SL-0501`) and instant QR code modal.

---

## Step 3: Field Inspection & AI Damage Detection (60 Seconds)
1. On the new asset detail page, click **Log Inspection**.
2. Select Rating `2 ⭐`, attach a photo or click **AI Analyze Photo**.
3. Observe AI Damage Detection result (`Pothole & Surface Crack`, severity `high`, confidence `88%`).
4. Click **Save Inspection Record**.
5. Observe the Health Score drop on the radial SVG HealthRing and marker color change.

---

## Step 4: RBAC & Permission Enforcement Moment (60 Seconds)
1. While logged in as **Engineer**, click **Change Status** and select `Decommissioned` or `Disposed`.
2. Observe permission block: `403 Forbidden` / button disabled.
3. Log in as **Supervisor** (`supervisor@demo.com` / `Super@123`):
   - Open **Work Orders** -> Assign maintenance task to `Demo Engineer`.
4. Log in as **Admin** (`admin@demo.com` / `Admin@123`):
   - Move status to `Decommissioned` with reason `End of economic service life`.
5. Log in as **Auditor** (`auditor@demo.com` / `Audit@123`):
   - Open **Audit Trail** (`/admin/audit`) -> Filter by `Outcome: Denied`.
   - Point out the immutable audit log capturing the engineer's blocked retirement attempt.

---

## Step 5: Public Citizen Report Auto-Matching (45 Seconds)
1. Open Public Citizen Portal (`http://localhost:5173/report`).
2. Click **Use My Current GPS** near seeded coordinates.
3. Type description: `Damaged streetlight pole leaning near junction`.
4. Click **Submit Citizen Report**.
5. Observe instant unique tracking code generated (e.g., `R-8F3K2`).
6. Click **View Live Report Status** -> Observe nearest asset auto-matched within 50 m and auto-created work order.
