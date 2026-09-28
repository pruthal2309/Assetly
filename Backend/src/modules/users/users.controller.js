import * as userService from './users.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';
import { writeAuditLog } from '../../middleware/audit.js';

export const list = asyncHandler(async (req, res) => {
  const users = await userService.listUsers(req.scope);
  res.json({ data: users });
});

export const invite = asyncHandler(async (req, res) => {
  try {
    const user = await userService.inviteUser(req.user, req.body);
    await writeAuditLog(req, {
      action: 'user.invite',
      outcome: 'success',
      entityType: 'User',
      entityId: user._id,
      changes: { after: { email: user.email, role: user.role, zoneIds: user.zoneIds } }
    });
    res.status(201).json({ data: user });
  } catch (err) {
    await writeAuditLog(req, {
      action: 'user.invite',
      outcome: 'denied',
      changes: { after: { email: req.body?.email, role: req.body?.role } }
    });
    throw err;
  }
});

export const resendInvite = asyncHandler(async (req, res) => {
  const result = await userService.resendInvite(req.user, req.params.id, req.scope);
  await writeAuditLog(req, {
    action: 'invitation.resent',
    outcome: 'success',
    entityType: 'User',
    entityId: req.params.id
  });
  res.json({ data: result });
});

export const update = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body, req.scope);
  await writeAuditLog(req, {
    action: 'user.update',
    outcome: 'success',
    entityType: 'User',
    entityId: user._id,
    changes: { after: req.body }
  });
  res.json({ data: user });
});

export const deactivate = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.user, req.params.id, req.scope);
  await writeAuditLog(req, {
    action: 'user.deactivated',
    outcome: 'success',
    entityType: 'User',
    entityId: user._id
  });
  res.json({ data: user });
});
