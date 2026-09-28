import * as authService from './auth.service.js';
import { env } from '../../config/env.js';
import { asyncHandler } from '../../common/asyncHandler.js';
import { writeAuditLog } from '../../middleware/audit.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
  maxAge: env.REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || '';

  const result = await authService.login(email, password, userAgent, ip);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.json({
    data: {
      accessToken: result.accessToken,
      user: result.user,
      zones: result.zones,
      permissions: result.permissions
    }
  });
});

export const verifyInvite = asyncHandler(async (req, res) => {
  const token = req.query.token;
  const result = await authService.verifyInvite(token);
  res.json({ data: result });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || '';
  const result = await authService.acceptInvite(req.body, userAgent, ip);

  await writeAuditLog(
    { ...req, user: { orgId: result.user.orgId, _id: result.user.id, role: result.user.role } },
    {
      action: 'invitation.accept',
      outcome: 'success',
      entityType: 'User',
      entityId: result.user.id
    }
  );

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.json({
    data: {
      accessToken: result.accessToken,
      user: result.user,
      zones: result.zones,
      permissions: result.permissions
    }
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip || '';

  const result = await authService.refresh(refreshToken, userAgent, ip);

  res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);
  res.json({
    data: {
      accessToken: result.accessToken
    }
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  await authService.logout(refreshToken);

  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ data: { message: 'Logged out successfully' } });
});

export const registerCitizen = asyncHandler(async (req, res) => {
  const user = await authService.registerCitizen(req.body);
  res.status(201).json({ data: user });
});

export const me = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user._id);
  res.json({ data });
});
