import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './db.js';

const PORT = Number(process.env.PORT) || 5000;

await connectDB(process.env.MONGO_URI);

createApp({ clientOrigin: process.env.CLIENT_ORIGIN }).listen(PORT, () => {
  console.log(`[server] EcoRoute API listening on http://localhost:${PORT}`);
});
