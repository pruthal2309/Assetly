import { Asset } from '../../models/Asset.js';
import { WorkOrder } from '../../models/WorkOrder.js';

export const getDashboardSummary = async (user, scopeFilter, extraZoneId) => {
  const filter = { ...scopeFilter, archivedAt: null };
  if (extraZoneId) {
    filter.zoneId = extraZoneId;
  }

  const [facetResult] = await Asset.aggregate([
    { $match: filter },
    {
      $facet: {
        total: [{ $count: 'n' }],
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byRisk: [{ $group: { _id: '$health.riskLevel', count: { $sum: 1 } } }],
        byCategory: [
          {
            $group: {
              _id: '$categoryKey',
              count: { $sum: 1 },
              avgHealth: { $avg: '$health.score' }
            }
          }
        ],
        overdueCount: [
          {
            $match: {
              status: 'in_service',
              nextInspectionDue: { $lt: new Date() }
            }
          },
          { $count: 'n' }
        ],
        criticalAssets: [
          { $match: { 'health.riskLevel': { $in: ['high', 'critical'] } } },
          { $sort: { 'health.score': 1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              assetCode: 1,
              name: 1,
              categoryKey: 1,
              status: 1,
              'health.score': 1,
              'health.riskLevel': 1,
              zoneId: 1
            }
          }
        ]
      }
    }
  ]);

  const woFilter = { orgId: user.orgId };
  if (user.role === 'engineer') {
    woFilter.assigneeId = user._id;
  } else if (user.role === 'supervisor') {
    woFilter.zoneId = { $in: user.zoneIds || [] };
  }

  const myWorkOrders = await WorkOrder.find({
    ...woFilter,
    status: { $in: ['open', 'assigned', 'in_progress'] }
  })
    .sort({ dueDate: 1, createdAt: -1 })
    .limit(10)
    .populate('assetId', 'assetCode name location')
    .populate('assigneeId', 'name email');

  // Cost trend by month
  const costTrend = await WorkOrder.aggregate([
    { $match: { orgId: user.orgId, status: 'completed' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
        cost: { $sum: '$actualCost' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const totalAssets = facetResult.total[0]?.n || 0;
  const overdueCount = facetResult.overdueCount[0]?.n || 0;

  return {
    totalAssets,
    byStatus: facetResult.byStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    byRisk: facetResult.byRisk.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    byCategory: facetResult.byCategory,
    overdueCount,
    criticalAssets: facetResult.criticalAssets,
    myWorkOrders,
    costTrend
  };
};
