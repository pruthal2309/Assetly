import { ROLE_PERMS } from '../common/permissions.js';
import { buildScopeFilter } from '../common/scope.js';
import { ForbiddenError } from '../common/errors.js';
import { writeAuditLog } from './audit.js';

export const authorize = (perm) => (req, res, next) => {
  const role = req.user?.role;
  const scope = ROLE_PERMS[role]?.[perm];

  if (!scope) {
    writeAuditLog(req, {
      action: perm,
      outcome: 'denied',
      changes: { reason: `Role ${role} does not possess permission ${perm}` }
    });
    return next(new ForbiddenError(`Permission denied for action: ${perm}`));
  }

  req.scope = buildScopeFilter(scope, req.user);
  req.permScope = scope;
  next();
};
