import { DEPARTMENTS, verifyFacultyCredentials, createFacultyToken } from '../../server/faculty.js';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { department, password } = req.body || {};
  if (typeof department !== 'string' || typeof password !== 'string' || !department || !password) {
    return res.status(400).json({ success: false, message: 'Department and password are required.' });
  }

  if (!process.env.FACULTY_JWT_SECRET) return res.status(503).json({success: false, message: 'Faculty login is not configured. Contact the administrator.'});

  const isValid = verifyFacultyCredentials(department, password);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid department password. Please check your credentials.' });
  }

  const token = createFacultyToken(department);
  return res.json({
    success: true,
    message: 'Faculty logged in successfully.',
    token,
    department,
    departmentName: DEPARTMENTS[department]?.name || department,
  });
}
