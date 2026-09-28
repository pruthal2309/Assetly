import { Asset } from '../../models/Asset.js';
import { WorkOrder } from '../../models/WorkOrder.js';
import { User } from '../../models/User.js';
import { Zone } from '../../models/Zone.js';
import { CitizenReport } from '../../models/CitizenReport.js';
import { AssetEvent } from '../../models/AssetEvent.js';

export const getDashboardSummary = async (user, scopeFilter, extraZoneId) => {
  const role = user.role || 'engineer';
  const orgId = user.orgId;

  if (role === 'admin') {
    const filter = { orgId, archivedAt: null };
    if (extraZoneId) filter.zoneId = extraZoneId;

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

    const totalAssets = facetResult?.total[0]?.n || 0;
    const overdueCount = facetResult?.overdueCount[0]?.n || 0;
    const criticalAssets = facetResult?.criticalAssets || [];

    // Work order statistics for org
    const allWorkOrders = await WorkOrder.find({ orgId });
    const now = new Date();

    const woStats = {
      total: allWorkOrders.length,
      open: allWorkOrders.filter((w) => w.status === 'open').length,
      assigned: allWorkOrders.filter((w) => w.status === 'assigned').length,
      inProgress: allWorkOrders.filter((w) => w.status === 'in_progress').length,
      submitted: allWorkOrders.filter((w) => w.status === 'submitted').length,
      completed: allWorkOrders.filter((w) => w.status === 'completed').length,
      cancelled: allWorkOrders.filter((w) => w.status === 'cancelled').length,
      overdue: allWorkOrders.filter(
        (w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)
      ).length
    };

    const maintenanceCostTotal = allWorkOrders
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + (w.actualCost || w.estimatedCost || 0), 0);

    const activeEngineersCount = await User.countDocuments({ orgId, role: 'engineer', isDeactivated: { $ne: true } });
    const activeSupervisorsCount = await User.countDocuments({ orgId, role: 'supervisor', isDeactivated: { $ne: true } });
    const activeZonesCount = await Zone.countDocuments({ orgId });
    const pendingCitizenReportsCount = await CitizenReport.countDocuments({ orgId, status: 'pending' });

    // Cost trend by month
    const costTrend = await WorkOrder.aggregate([
      { $match: { orgId, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } },
          cost: { $sum: '$actualCost' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Recent activity feed
    const recentActivity = await AssetEvent.find({ orgId })
      .sort({ createdAt: -1 })
      .limit(15)
      .populate('actorId', 'name role')
      .populate('assetId', 'name assetCode');

    return {
      role: 'admin',
      totalAssets,
      byStatus: (facetResult?.byStatus || []).reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byRisk: (facetResult?.byRisk || []).reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byCategory: facetResult?.byCategory || [],
      overdueCount,
      criticalAssets,
      workOrderStats: woStats,
      maintenanceCostTotal,
      activeEngineersCount,
      activeSupervisorsCount,
      activeZonesCount,
      pendingCitizenReportsCount,
      costTrend,
      recentActivity
    };
  }

  if (role === 'supervisor') {
    const zoneIds = user.zoneIds || [];
    const assetFilter = { orgId, zoneId: { $in: zoneIds }, archivedAt: null };

    const [facetResult] = await Asset.aggregate([
      { $match: assetFilter },
      {
        $facet: {
          total: [{ $count: 'n' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byRisk: [{ $group: { _id: '$health.riskLevel', count: { $sum: 1 } } }],
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

    const totalAssets = facetResult?.total[0]?.n || 0;
    const overdueCount = facetResult?.overdueCount[0]?.n || 0;
    const criticalAssets = facetResult?.criticalAssets || [];

    const zoneWorkOrders = await WorkOrder.find({ orgId, zoneId: { $in: zoneIds } })
      .populate('assetId', 'assetCode name location')
      .populate('assigneeId', 'name email role')
      .populate('submittedBy', 'name email role')
      .populate('createdBy', 'name email role');

    const now = new Date();
    const woStats = {
      total: zoneWorkOrders.length,
      open: zoneWorkOrders.filter((w) => w.status === 'open').length,
      assigned: zoneWorkOrders.filter((w) => w.status === 'assigned').length,
      inProgress: zoneWorkOrders.filter((w) => w.status === 'in_progress').length,
      submitted: zoneWorkOrders.filter((w) => w.status === 'submitted').length,
      completed: zoneWorkOrders.filter((w) => w.status === 'completed').length,
      cancelled: zoneWorkOrders.filter((w) => w.status === 'cancelled').length,
      overdue: zoneWorkOrders.filter(
        (w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)
      ).length
    };

    const submittedForReview = zoneWorkOrders.filter((w) => w.status === 'submitted');

    // Engineers in supervisor's zones
    const engineers = await User.find({
      orgId,
      role: 'engineer',
      zoneIds: { $in: zoneIds }
    });

    const myEngineers = engineers.map((eng) => {
      const engTasks = zoneWorkOrders.filter((w) => w.assigneeId && w.assigneeId._id.toString() === eng._id.toString());
      const activeTasks = engTasks.filter((w) => ['assigned', 'in_progress', 'submitted'].includes(w.status)).length;
      const completed = engTasks.filter((w) => w.status === 'completed').length;
      const overdue = engTasks.filter(
        (w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)
      ).length;
      return {
        _id: eng._id,
        name: eng.name,
        email: eng.email,
        activeTasks,
        completed,
        overdue
      };
    });

    const pendingCitizenReportsCount = await CitizenReport.countDocuments({
      orgId,
      zoneId: { $in: zoneIds },
      status: 'pending'
    });

    return {
      role: 'supervisor',
      totalAssets,
      byStatus: (facetResult?.byStatus || []).reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byRisk: (facetResult?.byRisk || []).reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      overdueCount,
      criticalAssets,
      workOrderStats: woStats,
      submittedForReview,
      myEngineers,
      pendingCitizenReportsCount,
      myWorkOrders: zoneWorkOrders.filter((w) => ['open', 'assigned', 'in_progress', 'submitted'].includes(w.status)).slice(0, 10)
    };
  }

  // Engineer Dashboard
  const myWorkOrders = await WorkOrder.find({ orgId, assigneeId: user._id })
    .sort({ dueDate: 1, createdAt: -1 })
    .populate('assetId', 'assetCode name location status health zoneId')
    .populate('createdBy', 'name email role')
    .populate('zoneId', 'name code');

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const activeTasks = myWorkOrders.filter((w) => ['assigned', 'in_progress', 'submitted'].includes(w.status));
  const inProgressCount = myWorkOrders.filter((w) => w.status === 'in_progress').length;
  const submittedCount = myWorkOrders.filter((w) => w.status === 'submitted').length;
  const urgentCount = activeTasks.filter((w) => w.priority === 'urgent' || w.priority === 'high').length;
  const overdueCount = activeTasks.filter((w) => w.dueDate && new Date(w.dueDate) < now).length;
  const dueTodayCount = activeTasks.filter((w) => {
    if (!w.dueDate) return false;
    const d = new Date(w.dueDate);
    return d >= startOfDay && d <= endOfDay;
  }).length;

  const myZoneAssetsCount = await Asset.countDocuments({
    orgId,
    zoneId: { $in: user.zoneIds || [] },
    archivedAt: null
  });

  return {
    role: 'engineer',
    myTaskStats: {
      totalActive: activeTasks.length,
      inProgressCount,
      submittedCount,
      urgentCount,
      overdueCount,
      dueTodayCount
    },
    myTasks: myWorkOrders,
    myZoneAssetsCount
  };
};

export const getOperationsWorkforce = async (user) => {
  const orgId = user.orgId;

  const supervisors = await User.find({ orgId, role: 'supervisor' }).populate('zoneIds', 'name code');
  const engineers = await User.find({ orgId, role: 'engineer' }).populate('zoneIds', 'name code');
  const workOrders = await WorkOrder.find({ orgId })
    .populate('assetId', 'assetCode name zoneId')
    .populate('assigneeId', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('zoneId', 'name code');

  const now = new Date();

  const supervisorData = supervisors.map((sup) => {
    const supZoneIds = (sup.zoneIds || []).map((z) => z._id.toString());
    const zoneWOs = workOrders.filter((w) => w.zoneId && supZoneIds.includes(w.zoneId._id.toString()));
    const activeEngineers = engineers.filter((e) =>
      (e.zoneIds || []).some((z) => supZoneIds.includes(z._id.toString()))
    );

    return {
      _id: sup._id,
      name: sup.name,
      email: sup.email,
      zones: sup.zoneIds || [],
      activeWorkOrdersCount: zoneWOs.filter((w) => ['open', 'assigned', 'in_progress', 'submitted'].includes(w.status)).length,
      completedCount: zoneWOs.filter((w) => w.status === 'completed').length,
      overdueCount: zoneWOs.filter((w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)).length,
      engineersCount: activeEngineers.length
    };
  });

  const engineerData = engineers.map((eng) => {
    const engWOs = workOrders.filter((w) => w.assigneeId && w.assigneeId._id.toString() === eng._id.toString());
    const currentTasks = engWOs.filter((w) => ['assigned', 'in_progress', 'submitted'].includes(w.status));
    const completedTasks = engWOs.filter((w) => w.status === 'completed');
    const overdueTasks = engWOs.filter((w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status));

    return {
      _id: eng._id,
      name: eng.name,
      email: eng.email,
      zones: eng.zoneIds || [],
      currentTasks,
      completedCount: completedTasks.length,
      overdueCount: overdueTasks.length,
      activeCount: currentTasks.length
    };
  });

  return {
    supervisors: supervisorData,
    engineers: engineerData
  };
};

export const getOperationsZonePerformance = async (user) => {
  const orgId = user.orgId;
  const zones = await Zone.find({ orgId });
  const assets = await Asset.find({ orgId, archivedAt: null });
  const workOrders = await WorkOrder.find({ orgId });
  const users = await User.find({ orgId });
  const citizenReports = await CitizenReport.find({ orgId, status: 'pending' });

  const now = new Date();

  return zones.map((zone) => {
    const zoneIdStr = zone._id.toString();
    const zoneAssets = assets.filter((a) => a.zoneId && a.zoneId.toString() === zoneIdStr);
    const highRiskAssets = zoneAssets.filter((a) => ['high', 'critical'].includes(a.health?.riskLevel));
    const zoneWOs = workOrders.filter((w) => w.zoneId && w.zoneId.toString() === zoneIdStr);

    const supervisor = users.find(
      (u) => u.role === 'supervisor' && (u.zoneIds || []).some((z) => z.toString() === zoneIdStr)
    );

    const zoneEngineers = users.filter(
      (u) => u.role === 'engineer' && (u.zoneIds || []).some((z) => z.toString() === zoneIdStr)
    );

    const maintenanceCost = zoneWOs
      .filter((w) => w.status === 'completed')
      .reduce((sum, w) => sum + (w.actualCost || w.estimatedCost || 0), 0);

    const pendingReports = citizenReports.filter((r) => r.zoneId && r.zoneId.toString() === zoneIdStr).length;

    return {
      _id: zone._id,
      name: zone.name,
      code: zone.code,
      supervisor: supervisor ? { _id: supervisor._id, name: supervisor.name, email: supervisor.email } : null,
      engineersCount: zoneEngineers.length,
      assetsCount: zoneAssets.length,
      highRiskAssetsCount: highRiskAssets.length,
      openWorkOrders: zoneWOs.filter((w) => w.status === 'open').length,
      inProgressWorkOrders: zoneWOs.filter((w) => w.status === 'in_progress').length,
      submittedWorkOrders: zoneWOs.filter((w) => w.status === 'submitted').length,
      completedWorkOrders: zoneWOs.filter((w) => w.status === 'completed').length,
      overdueWorkOrders: zoneWOs.filter(
        (w) => w.dueDate && new Date(w.dueDate) < now && !['completed', 'cancelled'].includes(w.status)
      ).length,
      maintenanceCost,
      pendingReportsCount: pendingReports
    };
  });
};
