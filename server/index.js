require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { isIP } = require('net');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const noteRoutes = require('./routes/notes');
const groceryRoutes = require('./routes/grocery');
const calendarRoutes = require('./routes/calendar');
const pushRoutes = require('./routes/push');
const userRoutes = require('./routes/users');
const { key: tokenEncryptionKey } = require('./lib/tokenCrypto');

for (const name of ['JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'TOKEN_ENCRYPTION_KEY']) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
}
tokenEncryptionKey(); // throws at startup if the key is malformed

const app = express();
const PORT = process.env.PORT || 5000;

// Render puts one proxy in front of the app
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((o) => o.trim()) }));
app.use(express.json());

// Requests arrive through Vercel's /api rewrite, so req.ip is a proxy address shared by
// every user — limiting on it would let one noisy client lock the whole family out.
// Vercel passes the real client IP in x-vercel-forwarded-for; fall back to req.ip when
// it's absent (local dev, direct hits).
function clientIp(req) {
  const forwarded = String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim();
  return ipKeyGenerator(isIP(forwarded) ? forwarded : req.ip);
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

connectDB()
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });
