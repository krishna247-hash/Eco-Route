import mongoose from 'mongoose';

/**
 * Connects to MongoDB. Resolves to true on success, false if the server is
 * unreachable — the app then keeps running on the in-memory store.
 */
export async function connectDB(uri) {
  if (!uri) {
    console.warn('[db] MONGO_URI not set — using in-memory store');
    return false;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[db] Connected to MongoDB at ${mongoose.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`[db] MongoDB unavailable (${err.message}) — using in-memory store`);
    return false;
  }
}

export function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}
