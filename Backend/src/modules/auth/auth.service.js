import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import { User } from '../../models/User.js';
import { UserInvitation } from '../../models/UserInvitation.js';
import { Session } from '../../models/Session.js';
import { Organization } from '../../models/Organization.js';
import { Zone } from '../../models/Zone.js';
import { ROLE_PERMS } from '../../common/permissions.js';
import { UnauthorizedError, BadRequestError, NotFoundError, ConflictError } from '../../common/errors.js';
import { clearUserCache } from '../../middleware/authenticate.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      orgId: user.orgId.toString(),
      role: user.role,
      zoneIds: (user.zoneIds || []).map((id) => id.toString()),
      tokenVersion: user.tokenVersion
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );
};

export const createSession = async (user, familyId = null, userAgent = '', ip = '') => {
  const rawRefreshToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const famId = familyId || randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  const session = await Session.create({
    userId: user._id,
    tokenHash,
    familyId: famId,
    userAgent,
    ip,
    expiresAt
  });

  return { rawRefreshToken, session };
};

export const login = async (email, password, userAgent, ip) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.status === 'invited') {
    throw new UnauthorizedError('Account invitation pending activation. Please accept your email invitation to activate your account.');
  }

  if (user.status !== 'active') {
    throw new UnauthorizedError('Account is deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const { rawRefreshToken } = await createSession(user, null, userAgent, ip);

  const userZones = await Zone.find({ _id: { $in: user.zoneIds } }).select('_id name code');
  const permissions = ROLE_PERMS[user.role] || {};

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      status: user.status
    },
    zones: userZones,
    permissions
  };
};

export const verifyInvite = async (token) => {
  if (!token) {
    throw new BadRequestError('Invitation token is required');
  }
  const tokenHash = hashToken(token);
  const invitation = await UserInvitation.findOne({ tokenHash });
  if (!invitation) {
    throw new NotFoundError('Invalid invitation token');
  }
  if (invitation.usedAt) {
    return { valid: false, status: 'already_used', message: 'This invitation has already been used.' };
  }
  if (invitation.expiresAt < new Date()) {
    return { valid: false, status: 'expired', message: 'This invitation has expired. Please ask your Assetly administrator to send a new invitation.' };
  }

  const user = await User.findById(invitation.userId).populate('zoneIds', '_id name code');
  if (!user) {
    throw new NotFoundError('Invited user account not found');
  }

  return {
    valid: true,
    status: 'valid',
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      zones: user.zoneIds || []
    }
  };
};

export const acceptInvite = async ({ token, password }, userAgent, ip) => {
  if (!token || !password) {
    throw new BadRequestError('Token and password are required');
  }
  const tokenHash = hashToken(token);
  const invitation = await UserInvitation.findOne({ tokenHash });
  if (!invitation) {
    throw new NotFoundError('Invalid invitation token');
  }
  if (invitation.usedAt) {
    throw new BadRequestError('This invitation has already been used.');
  }
  if (invitation.expiresAt < new Date()) {
    throw new BadRequestError('This invitation has expired. Please request a new invitation.');
  }

  const user = await User.findById(invitation.userId);
  if (!user) {
    throw new NotFoundError('Invited user account not found');
  }

  if (user.status !== 'invited') {
    throw new BadRequestError('Account is already active or invalid');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  user.passwordHash = passwordHash;
  user.status = 'active';
  user.lastLoginAt = new Date();
  await user.save();

  invitation.usedAt = new Date();
  await invitation.save();

  await UserInvitation.updateMany(
    { userId: user._id, _id: { $ne: invitation._id }, usedAt: null },
    { usedAt: new Date() }
  );

  const accessToken = generateAccessToken(user);
  const { rawRefreshToken } = await createSession(user, null, userAgent, ip);

  const userZones = await Zone.find({ _id: { $in: user.zoneIds } }).select('_id name code');
  const permissions = ROLE_PERMS[user.role] || {};

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      status: user.status
    },
    zones: userZones,
    permissions
  };
};

export const refresh = async (rawRefreshToken, userAgent, ip) => {
  if (!rawRefreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const session = await Session.findOne({ tokenHash });

  if (!session) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  if (session.revokedAt) {
    await Session.updateMany({ familyId: session.familyId }, { revokedAt: new Date() });
    throw new UnauthorizedError('Security violation: Revoked refresh token reused. All sessions revoked.');
  }

  if (session.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token expired');
  }

  const user = await User.findById(session.userId);
  if (!user || user.status !== 'active') {
    throw new UnauthorizedError('User account not active');
  }

  session.revokedAt = new Date();
  await session.save();

  const newSession = await createSession(user, session.familyId, userAgent, ip);
  session.replacedBy = newSession.session.tokenHash;
  await session.save();

  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    refreshToken: newSession.rawRefreshToken
  };
};

export const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await Session.updateOne({ tokenHash }, { revokedAt: new Date() });
};

export const registerCitizen = async ({ name, email, password }) => {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ConflictError('Email address is already registered');
  }

  let org = await Organization.findOne();
  if (!org) {
    org = await Organization.create({
      name: 'Infrastructure Management Authority',
      slug: 'infra-authority'
    });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    orgId: org._id,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'citizen',
    status: 'active'
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId).populate('zoneIds', '_id name code');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const permissions = ROLE_PERMS[user.role] || {};

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      status: user.status
    },
    zones: user.zoneIds || [],
    permissions
  };
};
