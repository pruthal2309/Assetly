import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const withTransaction = async (fn) => {
  if (!env.USE_TRANSACTIONS) {
    return fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    // If transactions are unsupported on standalone local mongo, fallback to non-transaction execution
    if (err.message && err.message.includes('Transaction numbers are only allowed on a replica set member')) {
      console.warn('⚠️ Replica set not enabled, executing without transaction session');
      return fn(null);
    }
    throw err;
  } finally {
    await session.endSession();
  }
};
