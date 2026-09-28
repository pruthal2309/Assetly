import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User.js';
import { UserInvitation } from '../../models/UserInvitation.js';
import { Zone } from '../../models/Zone.js';
import { Session } from '../../models/Session.js';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../common/errors.js';
import { clearUserCache } from '../../middleware/authenticate.js';
import { sendInvitationEmail } from '../../common/email.js';

export const listUsers = async (scopeFilter) => {
  const filter = { ...scopeFilter };
  if (filter.zoneId) {
    filter.zoneIds = filter.zoneId;
    delete filter.zoneId;
  }
  return User.find(filter).select('-passwordHash').populate('zoneIds', '_id name code').sort({ createdAt: -1 });
};

export const getUserById = async (id, scopeFilter) => {
  const user = await User.findOne({ _id: id, ...scopeFilter }).select('-passwordHash').populate('zoneIds', '_id name code');
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

export const inviteUser = async (actorUser, { name, email, role, zoneIds = [], password = null }) => {
  const allowedRoles = ['supervisor', 'engineer', 'auditor'];
  if (!allowedRoles.includes(role)) {
    throw new BadRequestError('Admin cannot invite users with role: ' + role);
  }

  if (['supervisor', 'engineer'].includes(role) && (!zoneIds || zoneIds.length === 0)) {
    throw new BadRequestError(`Role ${role} requires at least one assigned zone`);
  }

  if (zoneIds && zoneIds.length > 0) {
    const validZones = await Zone.find({ _id: { $in: zoneIds }, orgId: actorUser.orgId });
    if (validZones.length !== zoneIds.length) {
      throw new BadRequestError('One or more assigned zones do not belong to your organization');
    }
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ConflictError('User with this email address already exists');
  }

  // Generate initial password if not specified
  const initialPassword = password || `Assetly@${Math.floor(100 + Math.random() * 900)}`;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(initialPassword, salt);

  const user = await User.create({
    orgId: actorUser.orgId,
    name,
    email: normalizedEmail,
    role,
    zoneIds: zoneIds || [],
    status: 'active',
    passwordHash
  });

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await UserInvitation.create({
    orgId: actorUser.orgId,
    userId: user._id,
    tokenHash,
    expiresAt
  });

  const zones = zoneIds.length > 0 ? await Zone.find({ _id: { $in: zoneIds } }) : [];
  const zoneNames = zones.map((z) => `${z.name} (${z.code})`);

  await sendInvitationEmail({
    email: user.email,
    name: user.name,
    role: user.role,
    zoneNames,
    rawToken,
    password: initialPassword
  });

  return User.findById(user._id).select('-passwordHash').populate('zoneIds', '_id name code');
};

export const resendInvite = async (actorUser, targetUserId, scopeFilter) => {
  const targetUser = await User.findOne({ _id: targetUserId, ...scopeFilter });
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  // Generate new temporary password
  const newPassword = `Assetly@${Math.floor(100 + Math.random() * 900)}`;
  const salt = await bcrypt.genSalt(10);
  targetUser.passwordHash = await bcrypt.hash(newPassword, salt);
  targetUser.status = 'active';
  await targetUser.save();

  await UserInvitation.updateMany({ userId: targetUser._id, usedAt: null }, { usedAt: new Date() });

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await UserInvitation.create({
    orgId: actorUser.orgId,
    userId: targetUser._id,
    tokenHash,
    expiresAt
  });

  const zones = targetUser.zoneIds && targetUser.zoneIds.length > 0
    ? await Zone.find({ _id: { $in: targetUser.zoneIds } })
    : [];
  const zoneNames = zones.map((z) => `${z.name} (${z.code})`);

  await sendInvitationEmail({
    email: targetUser.email,
    name: targetUser.name,
    role: targetUser.role,
    zoneNames,
    rawToken,
    password: newPassword
  });

  return { message: 'Invitation and initial password resent successfully' };
};

export const updateUser = async (actorUser, targetUserId, updates, scopeFilter) => {
  const targetUser = await User.findOne({ _id: targetUserId, ...scopeFilter });
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (updates.role && actorUser._id.toString() === targetUserId.toString()) {
    throw new ForbiddenError('Users cannot change their own role');
  }

  if (
    (updates.role && updates.role !== 'admin' && targetUser.role === 'admin') ||
    (updates.status && updates.status === 'deactivated' && targetUser.role === 'admin')
  ) {
    const activeAdminCount = await User.countDocuments({
      orgId: targetUser.orgId,
      role: 'admin',
      status: 'active'
    });
    if (activeAdminCount <= 1) {
      throw new ConflictError('Cannot demote or deactivate the last active Admin in the organization');
    }
  }

  if (updates.role && ['supervisor', 'engineer'].includes(updates.role)) {
    const finalZones = updates.zoneIds !== undefined ? updates.zoneIds : targetUser.zoneIds;
    if (!finalZones || finalZones.length === 0) {
      throw new BadRequestError(`Role ${updates.role} requires at least one assigned zone`);
    }
  }

  let securityRevocationNeeded = false;
  if (updates.role && updates.role !== targetUser.role) {
    securityRevocationNeeded = true;
    targetUser.role = updates.role;
  }
  if (updates.status && updates.status !== targetUser.status) {
    if (updates.status === 'deactivated') {
      securityRevocationNeeded = true;
    }
    targetUser.status = updates.status;
  }
  if (updates.name) targetUser.name = updates.name;
  if (updates.zoneIds) targetUser.zoneIds = updates.zoneIds;

  if (securityRevocationNeeded) {
    targetUser.tokenVersion += 1;
    await Session.updateMany({ userId: targetUser._id }, { revokedAt: new Date() });
    clearUserCache(targetUser._id);
  }

  await targetUser.save();
  return User.findById(targetUser._id).select('-passwordHash').populate('zoneIds', '_id name code');
};

export const deactivateUser = async (actorUser, targetUserId, scopeFilter) => {
  return updateUser(actorUser, targetUserId, { status: 'deactivated' }, scopeFilter);
};
