import { db } from '../../server/db.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export default async function handler(req: any, res: any) {
  if (req.method !== 'PUT' && req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // 1. Verify Faculty Login Token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  // 2. Extract Data
  const { id, updates } = req.body;
  if (!id || !updates) {
    return res.status(400).json({ success: false, message: 'Student ID and updates are required.' });
  }

  // 3. Update Database
  try {
    const updatedStudent = await db.updateStudent(id, updates);
    if (updatedStudent) {
      return res.status(200).json({ success: true, message: 'Student updated successfully.', student: updatedStudent });
    } else {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
  } catch (error: any) {
    console.error('Update Error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'That Roll Number or Email is already in use by another student.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update student in the database.' });
  }
}
