import { Organization } from '../models/Organization.js';
import { Zone } from '../models/Zone.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Category } from '../models/Category.js';
import { Asset } from '../models/Asset.js';
import { Inspection } from '../models/Inspection.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { AssetEvent } from '../models/AssetEvent.js';
import { Media } from '../models/Media.js';
import { CitizenReport } from '../models/CitizenReport.js';
import { AuditLog } from '../models/AuditLog.js';
import { Counter } from '../models/Counter.js';
import { Notification } from '../models/Notification.js';

export const ensureIndexes = async () => {
  try {
    const models = [
      Organization, Zone, User, Session, Category, Asset,
      Inspection, WorkOrder, AssetEvent, Media, CitizenReport,
      AuditLog, Counter, Notification
    ];
    for (const model of models) {
      await model.syncIndexes();
    }
    console.log('✅ Database indexes synchronized');
  } catch (err) {
    console.error('⚠️ Index sync error:', err.message);
  }
};
