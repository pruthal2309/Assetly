import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Zone } from '../src/models/Zone.js';
import { Category } from '../src/models/Category.js';
import { Asset } from '../src/models/Asset.js';
import { WorkOrder } from '../src/models/WorkOrder.js';
import { generateAccessToken } from '../src/modules/auth/auth.service.js';

let mongoServer;
let org;
let zone1, zone2;
let category;
let users = {};
let assetZone1, assetZone2;
let tokens = {};

beforeAll(async () => {
  let uri = process.env.MONGODB_URI;
  try {
    mongoServer = await MongoMemoryServer.create({ instance: { dbName: 'test_rbac' } });
    uri = mongoServer.getUri();
  } catch (e) {
    console.warn('Using environment MONGODB_URI for test suite');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  org = await Organization.create({ name: 'Test Org ' + Date.now(), slug: 'test-org-' + Date.now() });
  zone1 = await Zone.create({ orgId: org._id, name: 'Zone 1', code: 'Z1-' + Date.now() });
  zone2 = await Zone.create({ orgId: org._id, name: 'Zone 2', code: 'Z2-' + Date.now() });

  category = await Category.create({
    orgId: org._id,
    key: 'streetlight-' + Date.now(),
    name: 'Streetlight',
    specSchema: [{ key: 'wattage', label: 'Wattage', type: 'number', required: true }]
  });

  const roles = ['admin', 'supervisor', 'engineer', 'auditor', 'citizen'];
  for (const role of roles) {
    const u = await User.create({
      orgId: org._id,
      name: `Test ${role}`,
      email: `${role}_${Date.now()}@test.com`,
      passwordHash: 'hash',
      role,
      zoneIds: role === 'engineer' ? [zone1._id] : [zone1._id, zone2._id],
      status: 'active'
    });
    users[role] = u;
    tokens[role] = generateAccessToken(u);
  }

  assetZone1 = await Asset.create({
    orgId: org._id,
    assetCode: 'SL-T1-' + Date.now(),
    name: 'Zone 1 Light',
    categoryId: category._id,
    categoryKey: category.key,
    zoneId: zone1._id,
    status: 'installed',
    location: { type: 'Point', coordinates: [74.85, 12.91] },
    createdBy: users.engineer._id,
    specs: { wattage: 60 }
  });

  assetZone2 = await Asset.create({
    orgId: org._id,
    assetCode: 'SL-T2-' + Date.now(),
    name: 'Zone 2 Light',
    categoryId: category._id,
    categoryKey: category.key,
    zoneId: zone2._id,
    status: 'installed',
    location: { type: 'Point', coordinates: [74.86, 12.92] },
    createdBy: users.admin._id,
    specs: { wattage: 90 }
  });
}, 300000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('RBAC & Permission Matrix Tests (Spec Section 9.9)', () => {
  it('Case 1: Engineer calls PATCH /assets/:id/status to decommissioned -> 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${assetZone1._id}/status`)
      .set('Authorization', `Bearer ${tokens.engineer}`)
      .send({ status: 'decommissioned', reason: 'Attempted retire' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('Case 2: Engineer reads asset in another zone (out-of-zone) -> 404 Not Found', async () => {
    const res = await request(app)
      .get(`/api/v1/assets/${assetZone2._id}`)
      .set('Authorization', `Bearer ${tokens.engineer}`);

    expect(res.status).toBe(404);
  });

  it('Case 3: Supervisor updates zoneId on an asset -> 403 Forbidden', async () => {
    const res = await request(app)
      .patch(`/api/v1/assets/${assetZone1._id}`)
      .set('Authorization', `Bearer ${tokens.supervisor}`)
      .send({ zoneId: zone2._id });

    expect(res.status).toBe(403);
  });

  it('Case 4: Auditor calls any POST/PATCH/DELETE write endpoint -> 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/assets')
      .set('Authorization', `Bearer ${tokens.auditor}`)
      .send({
        name: 'New Asset',
        categoryId: category._id,
        zoneId: zone1._id,
        location: { type: 'Point', coordinates: [74.85, 12.91] }
      });

    expect(res.status).toBe(403);
  });

  it('Case 5: Citizen calls GET /assets -> 403; GET /public/assets/:code returns limited fields', async () => {
    const resProtected = await request(app)
      .get('/api/v1/assets')
      .set('Authorization', `Bearer ${tokens.citizen}`);

    expect(resProtected.status).toBe(403);

    const resPublic = await request(app).get(`/api/v1/public/assets/${assetZone1.assetCode}`);
    expect(resPublic.status).toBe(200);
    expect(resPublic.body.data).toHaveProperty('assetCode');
    expect(resPublic.body.data).toHaveProperty('name');
    expect(resPublic.body.data).toHaveProperty('status');
    expect(resPublic.body.data).not.toHaveProperty('acquisitionCost');
    expect(resPublic.body.data).not.toHaveProperty('vendor');
  });

  it('Case 6: Engineer completes a work order assigned to someone else -> 403 Forbidden', async () => {
    const wo = await WorkOrder.create({
      orgId: org._id,
      assetId: assetZone1._id,
      zoneId: zone1._id,
      code: 'WO-TEST-' + Date.now(),
      title: 'Test Order',
      status: 'assigned',
      assigneeId: users.supervisor._id,
      createdBy: users.admin._id
    });

    const res = await request(app)
      .post(`/api/v1/work-orders/${wo._id}/complete`)
      .set('Authorization', `Bearer ${tokens.engineer}`)
      .send({ actualCost: 100 });

    expect(res.status).toBe(403);
  });

  it('Case 7: Admin demotes the last Admin in the org -> 409 Conflict', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${users.admin._id}`)
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ role: 'engineer' });

    expect(res.status).toBe(409);
  });

  it('Case 8: Engineer attempts to POST /work-orders (create work order) -> 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/work-orders')
      .set('Authorization', `Bearer ${tokens.engineer}`)
      .send({
        assetId: assetZone1._id,
        title: 'Unauthorized Engineer Creation Attempt'
      });

    expect(res.status).toBe(403);
  });

  it('Case 9: Work Order Controlled State Machine (Engineer submit -> Supervisor approve)', async () => {
    // 1. Supervisor creates work order and assigns to Engineer
    const wo = await WorkOrder.create({
      orgId: org._id,
      assetId: assetZone1._id,
      zoneId: zone1._id,
      code: 'WO-FLOW-' + Date.now(),
      title: 'Flow Test Order',
      status: 'in_progress',
      assigneeId: users.engineer._id,
      createdBy: users.supervisor._id
    });

    // 2. Engineer submits completed work
    const submitRes = await request(app)
      .post(`/api/v1/work-orders/${wo._id}/submit`)
      .set('Authorization', `Bearer ${tokens.engineer}`)
      .send({
        workNotes: 'Repaired street light housing and replaced 60W bulb.',
        actualCost: 1500
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('submitted');

    // 3. Supervisor approves work order
    const approveRes = await request(app)
      .post(`/api/v1/work-orders/${wo._id}/complete`)
      .set('Authorization', `Bearer ${tokens.supervisor}`)
      .send({
        reviewNotes: 'Verified field repairs. Looks good.'
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('completed');
  });
});
