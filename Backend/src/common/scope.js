export const buildScopeFilter = (scope, user) => {
  if (!user || scope === 'public') {
    return {};
  }

  const orgId = user.orgId;
  const userId = user._id;

  switch (scope) {
    case 'org':
      return { orgId };
    case 'zone':
      return {
        orgId,
        zoneId: { $in: user.zoneIds || [] }
      };
    case 'own':
      return {
        orgId,
        $or: [
          { createdBy: userId },
          { assigneeId: userId },
          { inspectorId: userId },
          { reporterId: userId }
        ]
      };
    default:
      return { orgId };
  }
};
