import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual, randomUUID } from 'crypto';
import { promisify } from 'util';
import QRCode from 'qrcode';
import sharp from 'sharp';
import createMemoryStore from 'memorystore';

const scryptAsync = promisify(scrypt);

// In-memory storage for serverless (note: this will reset on each deployment)
// For production, you'd want to use a database like Supabase, PlanetScale, or Neon
const users = new Map();
const qrCodes = new Map();
const shortCodeToQrId = new Map();
const sessions = new Map();

// Password hashing functions
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// QR Code styling function
async function applyQrStyle(qrBuffer, style) {
  try {
    const image = sharp(qrBuffer);
    
    if (style === 'rounded') {
      const metadata = await image.metadata();
      const size = metadata.width || 400;
      const cornerRadius = Math.floor(size * 0.05);
      
      const roundedCornerSvg = `<svg width="${size}" height="${size}">
        <defs>
          <clipPath id="rounded">
            <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
          </clipPath>
        </defs>
        <image width="${size}" height="${size}" clip-path="url(#rounded)" href="data:image/png;base64,${qrBuffer.toString('base64')}"/>
      </svg>`;
      
      return await sharp(Buffer.from(roundedCornerSvg)).png().toBuffer();
    }
    
    return qrBuffer;
  } catch (error) {
    console.error('Error applying QR style:', error);
    return qrBuffer;
  }
}

// Generate short code
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (shortCodeToQrId.has(result)) {
    return generateShortCode();
  }
  return result;
}

// Create Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration for serverless - using MemoryStore for simplicity
// In production, you'd want to use a persistent store like Redis
const MemoryStore = createMemoryStore(session);

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = Array.from(users.values()).find(u => u.username === username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = users.get(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const existingUser = Array.from(users.values()).find(u => u.username === req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const id = randomUUID();
    const user = {
      id,
      username: req.body.username,
      password: await hashPassword(req.body.password),
    };
    users.set(id, user);

    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login failed' });
      res.status(201).json({ id: user.id, username: user.username });
    });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(200).json({ id: user.id, username: user.username });
    });
  })(req, res, next);
});

app.post('/api/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json({ id: req.user.id, username: req.user.username });
});

// QR Code routes
app.post('/api/qr-codes', requireAuth, async (req, res) => {
  try {
    const id = randomUUID();
    const shortCode = generateShortCode();
    const now = new Date();
    
    const qrCode = {
      id,
      shortCode,
      userId: req.user.id,
      title: req.body.title,
      content: req.body.content,
      type: req.body.type || 'text',
      size: req.body.size || 400,
      margin: req.body.margin || 2,
      foregroundColor: req.body.foregroundColor || '#000000',
      backgroundColor: req.body.backgroundColor || '#ffffff',
      errorCorrection: req.body.errorCorrection || 'M',
      style: req.body.style || 'square',
      logoUrl: req.body.logoUrl,
      clickCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    
    qrCodes.set(id, qrCode);
    shortCodeToQrId.set(shortCode, id);
    
    res.status(201).json(qrCode);
  } catch (error) {
    console.error('Error creating QR code:', error);
    res.status(400).json({ message: 'Failed to create QR code' });
  }
});

app.get('/api/qr-codes', requireAuth, async (req, res) => {
  try {
    const userQrCodes = Array.from(qrCodes.values()).filter(qr => qr.userId === req.user.id);
    res.json(userQrCodes);
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    res.status(500).json({ message: 'Failed to fetch QR codes' });
  }
});

app.get('/api/qr-codes/:id/image', async (req, res) => {
  try {
    const qrCode = qrCodes.get(req.params.id);
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    let qrContent = qrCode.content;
    
    // Format content based on type
    switch (qrCode.type) {
      case 'email':
        qrContent = `mailto:${qrCode.content}`;
        break;
      case 'phone':
        qrContent = `tel:${qrCode.content}`;
        break;
      case 'sms':
        qrContent = `sms:${qrCode.content}`;
        break;
      case 'url':
        if (!qrCode.content.startsWith('http://') && !qrCode.content.startsWith('https://')) {
          qrContent = `https://${qrCode.content}`;
        }
        break;
      case 'wifi':
        const wifiParts = qrCode.content.split(':');
        if (wifiParts.length >= 2) {
          const networkName = wifiParts[0];
          const password = wifiParts[1];
          const security = wifiParts[2] || 'WPA';
          qrContent = `WIFI:T:${security};S:${networkName};P:${password};H:false;;`;
        }
        break;
      case 'vcard':
        if (!qrCode.content.includes('BEGIN:VCARD')) {
          qrContent = `BEGIN:VCARD\\nVERSION:3.0\\nFN:${qrCode.content}\\nEND:VCARD`;
        }
        break;
    }

    const qrOptions = {
      type: 'png',
      width: qrCode.size || 400,
      margin: qrCode.margin || 2,
      color: {
        dark: qrCode.foregroundColor || '#000000',
        light: qrCode.backgroundColor || '#ffffff'
      },
      errorCorrectionLevel: qrCode.errorCorrection || 'M'
    };

    let qrImage = await QRCode.toBuffer(qrContent, qrOptions);

    if (qrCode.style === 'rounded' || qrCode.style === 'dots') {
      qrImage = await applyQrStyle(qrImage, qrCode.style);
    }

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': qrImage.length,
    });
    res.send(qrImage);
  } catch (error) {
    console.error('Error generating QR code image:', error);
    res.status(500).json({ message: 'Failed to generate QR code image' });
  }
});

app.get('/api/r/:shortCode', async (req, res) => {
  try {
    const qrCodeId = shortCodeToQrId.get(req.params.shortCode);
    const qrCode = qrCodeId ? qrCodes.get(qrCodeId) : undefined;
    
    if (!qrCode) {
      return res.status(404).json({ message: 'QR code not found' });
    }

    // Update click count
    qrCode.clickCount = (qrCode.clickCount || 0) + 1;
    qrCode.updatedAt = new Date();
    qrCodes.set(qrCode.id, qrCode);

    let redirectUrl = qrCode.content;
    switch (qrCode.type) {
      case 'url':
        if (!redirectUrl.startsWith('http://') && !redirectUrl.startsWith('https://')) {
          redirectUrl = `https://${redirectUrl}`;
        }
        break;
      case 'email':
        redirectUrl = `mailto:${qrCode.content}`;
        break;
      case 'phone':
        redirectUrl = `tel:${qrCode.content}`;
        break;
      case 'sms':
        redirectUrl = `sms:${qrCode.content}`;
        break;
      case 'wifi':
        const wifiParts = qrCode.content.split(':');
        const networkName = wifiParts[0] || 'Unknown Network';
        const password = wifiParts[1] || '';
        return res.send(`<html><body><h1>WiFi Network</h1><p><strong>Network:</strong> ${networkName}</p><p><strong>Password:</strong> ${password}</p><p>Scan this QR code with your device to connect automatically.</p></body></html>`);
      case 'vcard':
        return res.send(`<html><body><h1>Contact Information</h1><pre>${qrCode.content}</pre></body></html>`);
      case 'text':
      default:
        return res.send(`<html><body><h1>QR Code Content</h1><p>${qrCode.content}</p></body></html>`);
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error handling QR code redirect:', error);
    res.status(500).json({ message: 'Failed to process QR code' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ message });
});

export default app;
