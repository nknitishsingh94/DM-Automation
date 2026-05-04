import bcrypt from 'bcryptjs';
import { createSupabaseModel } from '../utils/supabase.js';

const comparePassword = async function (candidatePassword, hashedPassword) {
  if (!candidatePassword || !hashedPassword) return false;
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

const hashPassword = async function (plainPassword) {
  return await bcrypt.hash(plainPassword, 10);
};

const User = createSupabaseModel('users', comparePassword, hashPassword);

export default User;
