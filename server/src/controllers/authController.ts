import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface GoogleTokenInfo {
  aud: string;
  email: string;
  email_verified: string;
  name?: string;
  sub: string;
}

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, secret, { expiresIn } as jwt.SignOptions);
};

const serializeUser = (user: { _id: unknown; name: string; email: string; monthlyBudget: number; currency: string; themePreference: string }) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  monthlyBudget: user.monthlyBudget,
  currency: user.currency,
  themePreference: user.themePreference
});

const verifyGoogleCredential = async (credential: string): Promise<GoogleTokenInfo> => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured on the server.');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (!response.ok) {
    throw new Error('Invalid Google credential.');
  }

  const tokenInfo = await response.json() as GoogleTokenInfo;
  if (tokenInfo.aud !== googleClientId) {
    throw new Error('Google token audience mismatch.');
  }

  if (tokenInfo.email_verified !== 'true') {
    throw new Error('Google email is not verified.');
  }

  return tokenInfo;
};

// @POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, monthlyBudget, currency, themePreference } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email already registered.' });
      return;
    }

    const user = await User.create({ name, email, password, monthlyBudget, currency, themePreference, authProvider: 'local' });
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (user && !user.password) {
      res.status(401).json({ success: false, message: 'This account uses Google sign-in.' });
      return;
    }

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/auth/google
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      credential,
      monthlyBudget,
      currency,
      themePreference = 'monochrome'
    } = req.body;

    if (!credential) {
      res.status(400).json({ success: false, message: 'Google credential is required.' });
      return;
    }

    const tokenInfo = await verifyGoogleCredential(credential);

    let user = await User.findOne({ email: tokenInfo.email });
    if (!user) {
      user = await User.create({
        name: tokenInfo.name || tokenInfo.email.split('@')[0],
        email: tokenInfo.email,
        googleId: tokenInfo.sub,
        authProvider: 'google',
        monthlyBudget,
        currency,
        themePreference
      });
    } else if (!user.googleId) {
      user.googleId = tokenInfo.sub;
      await user.save();
    }

    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      token,
      user: serializeUser(user)
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message || 'Google authentication failed.' });
  }
};

// @GET /api/auth/me
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/auth/update-budget
export const updateBudget = async (req: any, res: Response): Promise<void> => {
  try {
    const { monthlyBudget, currency, themePreference } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { monthlyBudget, currency, themePreference }, { new: true, runValidators: true });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    res.json({ success: true, user: serializeUser(user) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
