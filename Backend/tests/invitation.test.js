import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { UserInvitation } from '../src/models/UserInvitation.js';
import { Organization } from '../src/models/Organization.js';
import { Zone } from '../src/models/Zone.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { generateAccessToken } from '../src/modules/auth/auth.service.js';

let org;
let zone1, zone2;
let users = {};
let tokens = {};

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetly_test';

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(uri);

  await Promise.all([
    User.deleteMany({}),
    UserInvitation.deleteMany({}),
    Organization.deleteMany({}),
    Zone.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  org = await Organization.create({ name: 'Test Org Invitation', slug: 'test-org-invite-' + Date.now() });
  zone1 = await Zone.create({ orgId: org._id, name: 'Zone 1', code: 'Z1-' + Date.now() });
  zone2 = await Zone.create({ orgId: org._id, name: 'Zone 2', code: 'Z2-' + Date.now() });

  const roles = ['admin', 'supervisor', 'engineer', 'auditor', 'citizen'];
  for (const role of roles) {
    const u = await User.create({
      orgId: org._id,
      name: `Test ${role}`,
      email: `${role}_invite_${Date.now()}@test.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789',
      role,
      zoneIds: role === 'engineer' ? [zone1._id] : [zone1._id, zone2._id],
      status: 'active'
    });
    users[role] = u;
    tokens[role] = generateAccessToken(u);
  }
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
});

describe('User Invitation & Role Assignment Flow (Specification Suite)', () => {
  let engineerInviteToken = null;
  let supervisorInviteToken = null;
  let auditorInviteToken = null;
  let invitedEngineerUser = null;

  it('1. Admin can invite an Engineer with assigned zones', async () => {
    const res = await request(app)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: 'Rahul Engineer',
        email: 'rahul.eng@example.com',
        role: 'engineer',
        zoneIds: [zone1._id.toString()]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Rahul Engineer');
    expect(res.body.data.role).toBe('engineer');
    expect(res.body.data.status).toBe('invited');

    invitedEngineerUser = res.body.data;

    // Check DB: raw token must NOT be stored in DB, only tokenHash
    const invitation = await UserInvitation.findOne({ userId: res.body.data._id });
    expect(invitation).not.toBeNull();
    expect(invitation.tokenHash).toBeDefined();
    expect(invitation.usedAt).toBeNull();
    expect(invitation.tokenHash).not.toContain('rahul');

    // Verify Audit Log entry for invitation
    const audit = await AuditLog.findOne({ action: 'user.invite', entityId: res.body.data._id });
    expect(audit).not.toBeNull();
    expect(audit.outcome).toBe('success');
  });

  it('2. Admin can invite a Supervisor with assigned zones', async () => {
    const res = await request(app)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: 'Priya Supervisor',
        email: 'priya.sup@example.com',
        role: 'supervisor',
        zoneIds: [zone1._id.toString(), zone2._id.toString()]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('supervisor');
    expect(res.body.data.status).toBe('invited');
  });

  it('3. Admin can invite an Auditor (without requiring zone assignment)', async () => {
    const res = await request(app)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: 'Amit Auditor',
        email: 'amit.audit@example.com',
        role: 'auditor'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('auditor');
    expect(res.body.data.status).toBe('invited');
  });

  it('4. Engineer/Supervisor invitation requires at least 1 zone assignment', async () => {
    const res = await request(app)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: 'NoZone Engineer',
        email: 'nozone.eng@example.com',
        role: 'engineer',
        zoneIds: []
      });

    expect(res.status).toBe(400);
  });

  it('5. Admin cannot invite another Admin through normal invitation form', async () => {
    const res = await request(app)
      .post('/api/v1/users/invite')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({
        name: 'New Admin',
        email: 'newadmin@example.com',
        role: 'admin'
      });

    expect(res.status).toBe(400);
  });

  it('6. Non-admin roles (Engineer, Supervisor, Auditor) cannot invite users -> 403', async () => {
    for (const role of ['engineer', 'supervisor', 'auditor']) {
      const res = await request(app)
        .post('/api/v1/users/invite')
        .set('Authorization', `Bearer ${tokens[role]}`)
        .send({
          name: 'Unauthorized Invite',
          email: `unauth_${role}@example.com`,
          role: 'engineer',
          zoneIds: [zone1._id.toString()]
        });

      expect(res.status).toBe(403);
    }
  });

  it('7. Invited user CANNOT login before account activation -> 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.eng@example.com',
        password: 'AnyPassword123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('pending activation');
  });

  it('8. Verify invitation details endpoint works for valid token', async () => {
    // Manually create a known raw token and invitation for testing
    const rawToken = 'test_raw_token_secure_12345';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await UserInvitation.create({
      orgId: org._id,
      userId: invitedEngineerUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const res = await request(app)
      .get('/api/v1/auth/verify-invite')
      .query({ token: rawToken });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.user.name).toBe('Rahul Engineer');
    expect(res.body.data.user.email).toBe('rahul.eng@example.com');
    expect(res.body.data.user.role).toBe('engineer');
  });

  it('9. Accepting valid invitation updates status to active and sets password', async () => {
    const rawToken = 'test_raw_token_to_accept_789';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await UserInvitation.create({
      orgId: org._id,
      userId: invitedEngineerUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const res = await request(app)
      .post('/api/v1/auth/accept-invite')
      .send({
        token: rawToken,
        password: 'NewSecurePassword@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('active');
    expect(res.body.data.accessToken).toBeDefined();

    // Verify user in DB is active and password is saved as hash
    const updatedUser = await User.findById(invitedEngineerUser._id);
    expect(updatedUser.status).toBe('active');
    expect(updatedUser.passwordHash).not.toBe('NewSecurePassword@123');
    expect(updatedUser.passwordHash.length).toBeGreaterThan(20);

    // Verify invitation is marked used
    const inv = await UserInvitation.findOne({ tokenHash });
    expect(inv.usedAt).not.toBeNull();
  });

  it('10. Activated user can now login normally with new password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'rahul.eng@example.com',
        password: 'NewSecurePassword@123'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('engineer');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('11. Expired invitation token cannot be accepted -> returns 400', async () => {
    const tempUser = await User.create({
      orgId: org._id,
      name: 'Expired Test',
      email: 'expired.user@example.com',
      role: 'engineer',
      zoneIds: [zone1._id],
      status: 'invited'
    });

    const rawToken = 'expired_raw_token_000';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await UserInvitation.create({
      orgId: org._id,
      userId: tempUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() - 3600000) // Expired 1 hour ago
    });

    const res = await request(app)
      .post('/api/v1/auth/accept-invite')
      .send({
        token: rawToken,
        password: 'Password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('expired');
  });

  it('12. Used invitation token cannot be reused -> returns 400', async () => {
    const rawToken = 'already_used_token_111';
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    await UserInvitation.create({
      orgId: org._id,
      userId: invitedEngineerUser._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date()
    });

    const res = await request(app)
      .post('/api/v1/auth/accept-invite')
      .send({
        token: rawToken,
        password: 'AnotherPassword123'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('already been used');
  });

  it('13. Resending invitation invalidates the old token and creates a new one', async () => {
    const invitee = await User.create({
      orgId: org._id,
      name: 'Resend Invitee',
      email: 'resend.invitee@example.com',
      role: 'engineer',
      zoneIds: [zone1._id],
      status: 'invited'
    });

    const oldRawToken = 'old_token_resend_999';
    const oldHash = createHash('sha256').update(oldRawToken).digest('hex');

    await UserInvitation.create({
      orgId: org._id,
      userId: invitee._id,
      tokenHash: oldHash,
      expiresAt: new Date(Date.now() + 86400000)
    });

    const res = await request(app)
      .post(`/api/v1/users/${invitee._id}/resend-invite`)
      .set('Authorization', `Bearer ${tokens.admin}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('resent');

    // Verify old token is now invalidated (usedAt set)
    const oldInv = await UserInvitation.findOne({ tokenHash: oldHash });
    expect(oldInv.usedAt).not.toBeNull();

    // Verify a new active invitation exists
    const newInv = await UserInvitation.findOne({ userId: invitee._id, usedAt: null });
    expect(newInv).not.toBeNull();
    expect(newInv.tokenHash).not.toBe(oldHash);
  });

  it('14. Citizen registration forces role to citizen and sets active status', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-citizen')
      .send({
        name: 'Public Citizen',
        email: 'public.citizen@example.com',
        password: 'CitizenPassword123',
        role: 'admin' // Attempting to pass admin role in public signup
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('citizen'); // Must be citizen regardless!

    const userInDb = await User.findOne({ email: 'public.citizen@example.com' });
    expect(userInDb.role).toBe('citizen');
    expect(userInDb.status).toBe('active');
  });

  it('15. Deactivated user cannot login', async () => {
    const deactivatedUser = await User.create({
      orgId: org._id,
      name: 'Deactivated User',
      email: 'deactivated@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789',
      role: 'engineer',
      zoneIds: [zone1._id],
      status: 'deactivated'
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'deactivated@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toContain('deactivated');
  });
});
