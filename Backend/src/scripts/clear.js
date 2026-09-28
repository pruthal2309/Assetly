import { connectDB } from '../db/connect.js';
import { Organization } from '../models/Organization.js';
import { Zone } from '../models/Zone.js';
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

export const clearDatabase = async () => {
  console.log('🧹 Wiping all dummy data from database...');
  await connectDB();

  // Wipe dummy asset, work order, inspection, report collections
  await Promise.all([
    Asset.deleteMany({}),
    WorkOrder.deleteMany({}),
    Inspection.deleteMany({}),
    CitizenReport.deleteMany({}),
    AssetEvent.deleteMany({}),
    AuditLog.deleteMany({}),
    Media.deleteMany({}),
    Notification.deleteMany({}),
    Counter.deleteMany({}),
    Session.deleteMany({})
  ]);

  console.log('✅ Wiped all Assets, Work Orders, Inspections, Citizen Reports, Timeline Events, Audit Logs, and Sessions.');

  // Ensure default Organization exists
  let org = await Organization.findOne();
  if (!org) {
    org = await Organization.create({
      name: 'Infrastructure Management Authority',
      slug: 'infra-authority'
    });
  }

  // Ensure default Asset Categories exist with spec schemas for real asset registration
  const existingCatsCount = await Category.countDocuments();
  if (existingCatsCount === 0) {
    console.log('🏷️ Initializing clean Category schemas...');
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

    for (const cat of categoriesData) {
      await Category.create({ ...cat, orgId: org._id });
    }
  }

  // Ensure default Zone exists
  const existingZoneCount = await Zone.countDocuments();
  if (existingZoneCount === 0) {
    await Zone.create({ name: 'Zone 1 - Central Ward', code: 'Z1', orgId: org._id });
  }

  console.log('🎉 Database is clean and ready for real data entry!');
  process.exit(0);
};

clearDatabase().catch((err) => {
  console.error('❌ Clear database error:', err);
  process.exit(1);
});
