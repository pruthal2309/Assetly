import cron from 'node-cron';
import { Asset } from '../models/Asset.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { Counter } from '../models/Counter.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { computeHealth } from '../modules/assets/health.js';

export const initJobs = () => {
  // 1. Nightly health recompute at 02:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Running nightly health score recomputation job...');
    try {
      const cursor = Asset.find({ archivedAt: null }).cursor();
      for (let asset = await cursor.next(); asset != null; asset = await cursor.next()) {
        asset.health = computeHealth(asset);
        await asset.save();
      }
      console.log('✅ Nightly health score recomputation completed.');
    } catch (err) {
      console.error('❌ Nightly health job error:', err.message);
    }
  });

  // 2. Daily preventive work order generation at 06:00 AM (idempotent)
  cron.schedule('0 6 * * *', async () => {
    console.log('⏰ Running daily preventive work order generation job...');
    try {
      const overdueAssets = await Asset.find({
        status: 'in_service',
        nextInspectionDue: { $lt: new Date() },
        archivedAt: null
      });

      for (const asset of overdueAssets) {
        // Idempotency check: verify if an open preventive work order already exists
        const existingWO = await WorkOrder.findOne({
          assetId: asset._id,
          source: 'scheduled',
          status: { $in: ['open', 'assigned', 'in_progress'] }
        });

        if (!existingWO) {
          const year = new Date().getFullYear();
          const counter = await Counter.findByIdAndUpdate(
            `WO:${year}:${asset.orgId}`,
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );
          const woCode = `WO-${year}-${String(counter.seq).padStart(4, '0')}`;

          await WorkOrder.create({
            orgId: asset.orgId,
            assetId: asset._id,
            zoneId: asset.zoneId,
            code: woCode,
            title: `Scheduled Preventive Maintenance for ${asset.assetCode}`,
            description: 'Automated preventive work order generated due to upcoming/overdue inspection cycle.',
            priority: 'medium',
            status: 'open',
            source: 'scheduled',
            createdBy: asset.createdBy
          });

          asset.openWorkOrderCount += 1;
          await asset.save();
        }
      }
      console.log('✅ Daily preventive work order job completed.');
    } catch (err) {
      console.error('❌ Daily preventive work order job error:', err.message);
    }
  });

  // 3. Daily overdue notifications at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ Running daily overdue notification job...');
    try {
      const supervisors = await User.find({ role: { $in: ['admin', 'supervisor'] }, status: 'active' });
      const overdueWO = await WorkOrder.countDocuments({
        status: { $in: ['open', 'assigned', 'in_progress'] },
        dueDate: { $lt: new Date() }
      });

      if (overdueWO > 0) {
        for (const sup of supervisors) {
          await Notification.create({
            userId: sup._id,
            title: 'Overdue Work Orders Alert',
            message: `There are currently ${overdueWO} work orders past their due date requiring attention.`,
            type: 'warning'
          });
        }
      }
      console.log('✅ Daily overdue notification job completed.');
    } catch (err) {
      console.error('❌ Overdue notification job error:', err.message);
    }
  });

  console.log('⚙️ Background cron jobs scheduled successfully');
};
