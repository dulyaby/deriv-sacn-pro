import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { UserProfile, SubscriptionTier } from '../src/types/scanner';

const JWT_SECRET = process.env.JWT_SECRET || 'derivscan_saas_super_secret_jwt_key_2026';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

interface StoredUser extends UserProfile {
  passwordHash: string;
}

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const EMBEDDED_DERIV_API_TOKEN = 'pat_642200ea5f4790e185f9a837bec7349e3e7883a3e754865c05efc711f6d033a6';

// Seed initial users if file doesn't exist
const initialUsers: StoredUser[] = [
  {
    id: 'user_pro_demo',
    email: 'trader@derivscan.pro',
    name: 'Alex Pro Trader',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    tier: 'MONTHLY',
    tierExpiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    derivAppId: '1089',
    derivToken: EMBEDDED_DERIV_API_TOKEN,
    derivAccount: {
      loginid: 'CR2983411',
      balance: 2450.50,
      currency: 'USD',
      isVirtual: false
    }
  },
  {
    id: 'user_free_demo',
    email: 'free@derivscan.pro',
    name: 'Guest Trader',
    passwordHash: bcrypt.hashSync('Password123!', 10),
    tier: 'FREE',
    tierExpiresAt: null,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    derivAppId: '1089'
  }
];

function loadUsers(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading users file:', err);
  }
  // Initialize with seed
  saveUsers(initialUsers);
  return initialUsers;
}

function saveUsers(users: StoredUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

let memoryUsers = loadUsers();

export function generateToken(user: UserProfile): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      tier: user.tier,
      tierExpiresAt: user.tierExpiresAt
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; tier: SubscriptionTier } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; tier: SubscriptionTier };
  } catch {
    return null;
  }
}

export async function registerUser(email: string, password: string, name: string): Promise<{ token: string; user: UserProfile }> {
  const existing = memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: StoredUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase(),
    name,
    passwordHash,
    tier: 'FREE',
    tierExpiresAt: null,
    createdAt: Date.now(),
    derivAppId: '1089'
  };

  memoryUsers.push(newUser);
  saveUsers(memoryUsers);

  const { passwordHash: _, ...publicProfile } = newUser;
  const token = generateToken(publicProfile);
  return { token, user: publicProfile };
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const user = memoryUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password.');
  }

  // Check if subscription expired
  if (user.tier !== 'FREE' && user.tierExpiresAt && user.tierExpiresAt < Date.now()) {
    user.tier = 'FREE';
    user.tierExpiresAt = null;
    saveUsers(memoryUsers);
  }

  const { passwordHash: _, ...publicProfile } = user;
  const token = generateToken(publicProfile);
  return { token, user: publicProfile };
}

export function getUserById(id: string): UserProfile | null {
  const user = memoryUsers.find((u) => u.id === id);
  if (!user) return null;
  const { passwordHash: _, ...publicProfile } = user;
  return publicProfile;
}

export function upgradeUserTier(userId: string, tier: SubscriptionTier, durationDays: number): UserProfile {
  const userIndex = memoryUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  const expiry = durationDays > 0 ? Date.now() + durationDays * 24 * 60 * 60 * 1000 : null;
  memoryUsers[userIndex].tier = tier;
  memoryUsers[userIndex].tierExpiresAt = expiry;
  saveUsers(memoryUsers);

  const { passwordHash: _, ...publicProfile } = memoryUsers[userIndex];
  return publicProfile;
}

export function updateUserDerivSettings(userId: string, derivToken: string, derivAppId?: string, accountInfo?: UserProfile['derivAccount']): UserProfile {
  const userIndex = memoryUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  memoryUsers[userIndex].derivToken = derivToken;
  if (derivAppId) memoryUsers[userIndex].derivAppId = derivAppId;
  if (accountInfo) memoryUsers[userIndex].derivAccount = accountInfo;

  saveUsers(memoryUsers);

  const { passwordHash: _, ...publicProfile } = memoryUsers[userIndex];
  return publicProfile;
}
