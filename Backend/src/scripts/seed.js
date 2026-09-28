import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../db/connect.js';
import { Organization } from '../models/Organization.js';
import { Zone } from '../models/Zone.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Category } from '../models/Category.js';
import { Asset } from '../models/Asset.js';
import { Inspection } from '../models/Inspection.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { AssetEvent } from '../models/AssetEvent.js';
import { Media } from '../models/Media.js';
import { CitizenReport } from '../models/CitizenReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { Counter } from '../models/Counter.js';
import { Notification } from '../models/Notification.js';
import { computeHealth } from '../modules/assets/health.js';

const getRandomPointNear = (centerLat, centerLng, radiusKm = 6) => {
  const rInDeg = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = rInDeg * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  const newLng = centerLng + x / Math.cos((centerLat * Math.PI) / 180);
  const newLat = centerLat + y;
  return [Number(newLng.toFixed(6)), Number(newLat.toFixed(6))];
};

export const seedDatabase = async () => {
  console.log('🌱 Starting Assetly database seed process...');
  await connectDB();

  // Wipe database collections
  console.log('🧹 Wiping existing collections...');
  await Promise.all([
    Organization.deleteMany({}),
    Zone.deleteMany({}),
    User.deleteMany({}),
    Session.deleteMany({}),
    Category.deleteMany({}),
    Asset.deleteMany({}),
    Inspection.deleteMany({}),
    WorkOrder.deleteMany({}),
    AssetEvent.deleteMany({}),
    Media.deleteMany({}),
    CitizenReport.deleteMany({}),
    AuditLog.deleteMany({}),
    Counter.deleteMany({}),
    Notification.deleteMany({})
  ]);

  // 1. Organization
  console.log('🏢 Creating Organization...');
  const org = await Organization.create({
    name: 'Demo City Infrastructure Management Authority',
    slug: 'demo-city'
  });

  // 2. Zones
  console.log('🗺️ Creating 5 Wards/Zones...');
  const zoneData = [
    { name: 'Ward 1 - North Coastal', code: 'Z1' },
    { name: 'Ward 2 - South Harbor', code: 'Z2' },
    { name: 'Ward 3 - East Commercial', code: 'Z3' },
    { name: 'Ward 4 - West Residential', code: 'Z4' },
    { name: 'Ward 5 - Central Industrial', code: 'Z5' }
  ];
  const zones = [];
  for (const zd of zoneData) {
    const z = await Zone.create({ ...zd, orgId: org._id });
    zones.push(z);
  }

  // 3. Categories with specSchemas
  console.log('🏷️ Creating 6 Asset Categories...');
  const categoriesData = [
    {
      key: 'streetlight',
      name: 'Streetlight',
      defaultLifeYears: 10,
      inspectionIntervalDays: 180,
      icon: 'lamp',
      specSchema: [
        { key: 'wattage', label: 'Wattage (W)', type: 'number', unit: 'W', required: true, min: 10, max: 1000 },
        { key: 'poleHeightM', label: 'Pole Height (m)', type: 'number', unit: 'm', required: false, min: 2, max: 30 }
      ]
    },
    {
      key: 'road',
      name: 'Road Segment',
      defaultLifeYears: 15,
      inspectionIntervalDays: 90,
      icon: 'road',
      specSchema: [
        { key: 'lanes', label: 'Number of Lanes', type: 'number', required: true, min: 1, max: 12 },
        { key: 'pavementType', label: 'Pavement Type', type: 'select', options: ['Asphalt', 'Concrete', 'Paver Block'], required: true }
      ]
    },
    {
      key: 'drain',
      name: 'Drainage Channel',
      defaultLifeYears: 20,
      inspectionIntervalDays: 120,
      icon: 'droplet',
      specSchema: [
        { key: 'widthM', label: 'Width (m)', type: 'number', unit: 'm', required: true },
        { key: 'depthM', label: 'Depth (m)', type: 'number', unit: 'm', required: true }
      ]
    },
    {
      key: 'pipeline',
      name: 'Water Pipeline',
      defaultLifeYears: 25,
      inspectionIntervalDays: 180,
      icon: 'git-commit',
      specSchema: [
        { key: 'diameterMm', label: 'Diameter (mm)', type: 'number', unit: 'mm', required: true },
        { key: 'pressureRatingBar', label: 'Pressure Rating (Bar)', type: 'number', unit: 'Bar', required: false }
      ]
    },
    {
      key: 'bridge',
      name: 'Bridge / Flyover',
      defaultLifeYears: 50,
      inspectionIntervalDays: 365,
      icon: 'git-pull-request',
      specSchema: [
        { key: 'lengthM', label: 'Total Length (m)', type: 'number', unit: 'm', required: true },
        { key: 'spanCount', label: 'Number of Spans', type: 'number', required: false }
      ]
    },
    {
      key: 'building',
      name: 'Public Building',
      defaultLifeYears: 40,
      inspectionIntervalDays: 180,
      icon: 'building',
      specSchema: [
        { key: 'floors', label: 'Number of Floors', type: 'number', required: true },
        { key: 'totalAreaSqFt', label: 'Total Area (sq ft)', type: 'number', unit: 'sq ft', required: true }
      ]
    }
  ];
  const categoriesMap = {};
  for (const cat of categoriesData) {
    const createdCat = await Category.create({ ...cat, orgId: org._id });
    categoriesMap[cat.key] = createdCat;
  }

  // 4. Seed Demo Users
  console.log('👥 Creating Demo Users...');
  const salt = await bcrypt.genSalt(10);
  const users = {
    admin: await User.create({
      orgId: org._id,
      name: 'Demo Admin',
      email: 'admin@demo.com',
      passwordHash: await bcrypt.hash('Admin@123', salt),
      role: 'admin',
      status: 'active'
    }),
    supervisor: await User.create({
      orgId: org._id,
      name: 'Demo Supervisor',
      email: 'supervisor@demo.com',
      passwordHash: await bcrypt.hash('Super@123', salt),
      role: 'supervisor',
      zoneIds: [zones[0]._id, zones[1]._id],
      status: 'active'
    }),
    engineer: await User.create({
      orgId: org._id,
      name: 'Demo Engineer',
      email: 'engineer@demo.com',
      passwordHash: await bcrypt.hash('Engineer@123', salt),
      role: 'engineer',
      zoneIds: [zones[0]._id],
      status: 'active'
    }),
    auditor: await User.create({
      orgId: org._id,
      name: 'Demo Auditor',
      email: 'auditor@demo.com',
      passwordHash: await bcrypt.hash('Audit@123', salt),
      role: 'auditor',
      status: 'active'
    }),
    citizen: await User.create({
      orgId: org._id,
      name: 'Demo Citizen',
      email: 'citizen@demo.com',
      passwordHash: await bcrypt.hash('Citizen@123', salt),
      role: 'citizen',
      status: 'active'
    })
  };

  // 5. Seed 500 Assets
  console.log('🏗️ Generating 500 Realistic Infrastructure Assets...');
  const assetDistribution = [
    { key: 'streetlight', count: 200, prefix: 'SL' },
    { key: 'road', count: 125, prefix: 'RD' },
    { key: 'drain', count: 75, prefix: 'DR' },
    { key: 'pipeline', count: 50, prefix: 'PL' },
    { key: 'bridge', count: 25, prefix: 'BR' },
    { key: 'building', count: 25, prefix: 'BD' }
  ];

  const assetDocsToInsert = [];
  const centerLat = env.SEED_CENTER_LAT || 12.9141;
  const centerLng = env.SEED_CENTER_LNG || 74.8560;

  for (const dist of assetDistribution) {
    const category = categoriesMap[dist.key];
    for (let i = 1; i <= dist.count; i++) {
      const seqStr = String(i).padStart(4, '0');
      const assetCode = `${dist.prefix}-${seqStr}`;
      const zone = zones[(i - 1) % zones.length];
      const coords = getRandomPointNear(centerLat, centerLng, 6);

      const ageYears = Math.floor(Math.random() * 15);
      const installDate = new Date();
      installDate.setFullYear(installDate.getFullYear() - ageYears);

      let specs = {};
      if (dist.key === 'streetlight') specs = { wattage: [40, 60, 90, 120][i % 4], poleHeightM: 8 };
      else if (dist.key === 'road') specs = { lanes: (i % 4) + 1, pavementType: ['Asphalt', 'Concrete'][i % 2] };
      else if (dist.key === 'drain') specs = { widthM: 1.5, depthM: 2.0 };
      else if (dist.key === 'pipeline') specs = { diameterMm: 300, pressureRatingBar: 10 };
      else if (dist.key === 'bridge') specs = { lengthM: 150, spanCount: 4 };
      else if (dist.key === 'building') specs = { floors: 4, totalAreaSqFt: 25000 };

      const statuses = ['in_service', 'in_service', 'in_service', 'under_maintenance', 'installed'];
      const status = statuses[i % statuses.length];

      const assetDoc = {
        orgId: org._id,
        assetCode,
        name: i === 1 ? `⭐ Hero Asset: ${category.name} ${dist.prefix}-0001` : `${category.name} ${dist.prefix}-${seqStr}`,
        categoryId: category._id,
        categoryKey: category.key,
        zoneId: zone._id,
        status,
        location: { type: 'Point', coordinates: coords },
        address: `${dist.prefix} Main Sector ${i}, Ward ${zone.code}`,
        installDate,
        acquisitionCost: (i * 12000) % 250000 + 10000,
        vendor: 'City Infra Corp',
        expectedLifeYears: category.defaultLifeYears,
        specs,
        createdBy: users.engineer._id,
        lastInspection: {
          at: new Date(Date.now() - (i % 90) * 86400000),
          rating: (i % 5) + 1,
          inspectorId: users.engineer._id,
          aiSeverity: ['none', 'low', 'medium', 'high'][(i % 4)]
        },
        nextInspectionDue: new Date(Date.now() + ((i % 180) - 30) * 86400000),
        openWorkOrderCount: status === 'under_maintenance' ? 1 : 0
      };

      assetDoc.health = computeHealth(assetDoc);
      assetDocsToInsert.push(assetDoc);
    }
  }

  const createdAssets = await Asset.insertMany(assetDocsToInsert);

  for (const dist of assetDistribution) {
    await Counter.findByIdAndUpdate(
      `${dist.prefix}:${org._id}`,
      { seq: dist.count },
      { upsert: true }
    );
  }

  // Hero Assets
  const hero1 = createdAssets[0];
  hero1.name = '⭐ Hero Asset: MG Road Smart Streetlight 01';
  hero1.status = 'in_service';
  await hero1.save();

  // 6. Seed 250 Inspections in Bulk
  console.log('🔍 Logging 250 Inspection Records...');
  const inspectionDocs = [];
  for (let i = 0; i < 250; i++) {
    const asset = createdAssets[i * 2];
    inspectionDocs.push({
      orgId: org._id,
      assetId: asset._id,
      zoneId: asset.zoneId,
      inspectorId: users.engineer._id,
      rating: (i % 5) + 1,
      notes: `Routine inspection #${i + 1}. Condition checked.`,
      ai: {
        damageType: i % 3 === 0 ? 'Surface Cracks' : 'Minor Wear',
        severity: ['none', 'low', 'medium', 'high'][i % 4],
        confidence: 0.88,
        model: 'MockDamageVision-v1'
      },
      inspectedAt: new Date(Date.now() - (i * 2) * 86400000)
    });
  }
  await Inspection.insertMany(inspectionDocs);

  // 7. Seed 70 Work Orders in Bulk
  console.log('🛠️ Creating 70 Work Orders in Mixed States...');
  const woStatuses = ['open', 'assigned', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const woDocs = [];

  for (let i = 1; i <= 70; i++) {
    const asset = createdAssets[i * 5];
    const woStatus = woStatuses[i % woStatuses.length];
    const woCode = `WO-2026-${String(i).padStart(4, '0')}`;

    woDocs.push({
      orgId: org._id,
      assetId: asset._id,
      zoneId: asset.zoneId,
      code: woCode,
      title: `Maintenance Request #${i} for ${asset.assetCode}`,
      description: `Fix structural defects and perform preventive servicing on ${asset.name}.`,
      priority: priorities[i % priorities.length],
      status: woStatus,
      source: i % 2 === 0 ? 'inspection' : 'scheduled',
      assigneeId: users.engineer._id,
      createdBy: users.supervisor._id,
      dueDate: new Date(Date.now() + (i % 14) * 86400000),
      estimatedCost: 1500 + i * 200,
      actualCost: woStatus === 'completed' ? 1400 + i * 200 : 0,
      completedAt: woStatus === 'completed' ? new Date() : undefined
    });
  }
  await WorkOrder.insertMany(woDocs);
  await Counter.findByIdAndUpdate(`WO:2026:${org._id}`, { seq: 70 }, { upsert: true });

  // 8. Seed 12 Citizen Reports
  console.log('📢 Creating 12 Citizen Reports...');
  const reportDocs = [];
  for (let i = 1; i <= 12; i++) {
    const asset = createdAssets[i * 10];
    const reportCode = `R-CR00${i}`;

    reportDocs.push({
      orgId: org._id,
      trackingCode: reportCode,
      reporterId: users.citizen._id,
      contact: 'citizen.demo@example.com',
      description: `Reported damaged pavement/pipe leakage near ${asset.name}`,
      location: asset.location,
      matchedAssetId: asset._id,
      matchDistanceM: 12,
      status: i % 2 === 0 ? 'matched' : 'received'
    });
  }
  await CitizenReport.insertMany(reportDocs);

  // 9. Timeline Events for Hero Asset 1
  console.log('📜 Populating Hero Timeline Events...');
  await AssetEvent.insertMany([
    {
      orgId: org._id,
      assetId: hero1._id,
      zoneId: hero1.zoneId,
      type: 'asset.created',
      actorId: users.engineer._id,
      at: new Date(Date.now() - 365 * 86400000),
      data: { assetCode: hero1.assetCode, name: hero1.name, status: 'planned' }
    },
    {
      orgId: org._id,
      assetId: hero1._id,
      zoneId: hero1.zoneId,
      type: 'status.changed',
      actorId: users.supervisor._id,
      at: new Date(Date.now() - 300 * 86400000),
      data: { from: 'planned', to: 'acquired' }
    },
    {
      orgId: org._id,
      assetId: hero1._id,
      zoneId: hero1.zoneId,
      type: 'status.changed',
      actorId: users.engineer._id,
      at: new Date(Date.now() - 250 * 86400000),
      data: { from: 'acquired', to: 'installed' }
    },
    {
      orgId: org._id,
      assetId: hero1._id,
      zoneId: hero1.zoneId,
      type: 'status.changed',
      actorId: users.engineer._id,
      at: new Date(Date.now() - 200 * 86400000),
      data: { from: 'installed', to: 'in_service' }
    },
    {
      orgId: org._id,
      assetId: hero1._id,
      zoneId: hero1.zoneId,
      type: 'inspection.logged',
      actorId: users.engineer._id,
      at: new Date(Date.now() - 30 * 86400000),
      data: { rating: 4, aiSeverity: 'low', newHealthScore: 92 }
    }
  ]);

  console.log('✅ Seed complete! All 5 demo user credentials ready.');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo User Accounts:');
  console.log(' - Admin:      admin@demo.com      / Admin@123');
  console.log(' - Supervisor: supervisor@demo.com / Super@123');
  console.log(' - Engineer:   engineer@demo.com   / Engineer@123');
  console.log(' - Auditor:    auditor@demo.com    / Audit@123');
  console.log(' - Citizen:    citizen@demo.com    / Citizen@123');
  console.log('----------------------------------------------------');

  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('❌ Seed script error:', err);
  process.exit(1);
});
