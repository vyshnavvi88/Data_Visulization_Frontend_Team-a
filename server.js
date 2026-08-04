import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const USERS_FILE = path.join(__dirname, 'frontend', 'data', 'users.json');

// Helper to read users
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      // Create directories if needed
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

// Helper to write users
function writeUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing users file:', err);
  }
}

// Signup route
app.post('/api/signup', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = readUsers();
  const duplicate = users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() || 
    u.email.toLowerCase() === email.toLowerCase()
  );

  if (duplicate) {
    return res.status(409).json({ error: 'Username or email already exists.' });
  }

  users.push({ username, email, password });
  writeUsers(users);
  res.status(201).json({ message: 'User registered successfully.' });
});

// Login route
app.post('/api/login', (req, res) => {
  const { identity, password } = req.body;
  if (!identity || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = readUsers();
  const foundUser = users.find(u => 
    (u.username.toLowerCase() === identity.trim().toLowerCase() || 
     u.email.toLowerCase() === identity.trim().toLowerCase()) && 
    u.password === password
  );

  // Fallback default admin if no users are registered
  const isAdminDefault = users.length === 0 && 
    (identity.trim().toLowerCase() === 'admin' && password === 'admin123');

  if (foundUser || isAdminDefault) {
    const user = foundUser || { username: 'Admin Operator', email: 'admin@infosys.com' };
    return res.status(200).json({
      username: user.username,
      email: user.email
    });
  }

  res.status(401).json({ error: 'Invalid username/email or password.' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
