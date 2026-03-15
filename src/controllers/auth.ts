
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(400).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, role: user.role });
    res.json({ accessToken, refreshToken });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: 'Access denied, no token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as any;
    const accessToken = generateAccessToken({ id: decoded.id, role: decoded.role });
    res.json({ accessToken });
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};
