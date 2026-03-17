const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
    console.warn('\x1b[33m⚠ WARNING: JWT_SECRET not set in .env. Using default secret — not safe for production.\x1b[0m');
}
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_visuaize';

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
}));
app.use(express.json());

// --- RATE LIMITING ---
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    limit: 20, // limit each IP to 20 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Initialize Database
let db;
async function initializeDB() {
    db = await open({
        filename: process.env.VERCEL ? ':memory:' : path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT,
            messages TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    `);
    console.log("Database initialized.");
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// --- AUTHENTICATION ROUTES ---

app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    try {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ id: req.user.id, username: req.user.username });
});

// --- CONVERSATION ROUTES ---

// Get all past conversations for user
app.get('/api/conversations', authenticateToken, async (req, res) => {
    try {
        const conversations = await db.all('SELECT id, title, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific conversation
app.get('/api/conversations/:id', authenticateToken, async (req, res) => {
    try {
        const conversation = await db.get('SELECT * FROM conversations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        conversation.messages = JSON.parse(conversation.messages);
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or update conversation
app.post('/api/conversations', authenticateToken, async (req, res) => {
    const { id, title, messages } = req.body;
    const messagesJson = JSON.stringify(messages);

    try {
        if (id) {
            // Update existing
            await db.run('UPDATE conversations SET title = ?, messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
                [title, messagesJson, id, req.user.id]);
            res.json({ id, message: 'Conversation updated' });
        } else {
            // Create new
            const result = await db.run('INSERT INTO conversations (user_id, title, messages) VALUES (?, ?, ?)',
                [req.user.id, title || 'New Conversation', messagesJson]);
            res.status(201).json({ id: result.lastID, message: 'Conversation created' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

initializeDB().then(() => {
    // Always start server in development mode
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

module.exports = app;
