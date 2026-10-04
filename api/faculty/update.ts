import { db } from '../../server/db.js';
import { verifyFacultyToken, canAccessStudent, DEPARTMENTS } from '../../server/faculty.js';

import { validateStudentUpdates } from '../../src/lib/student-updates.js';

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
  const decoded = verifyFacultyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  try {
    // 2. Safely parse the body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id, updates: input } = body || {};

    if (typeof id !== 'string' || !input) {
      return res.status(400).json({ success: false, message: 'Student ID and updates are required.' });
    }

    const existing = await db.findStudentById(id);
    if (!existing) return res.status(404).json({success:false, message:'Student not found.'});
    if (!canAccessStudent(decoded.dept, existing.branch)) return res.status(403).json({success:false, message:'Access denied.'});
    const {updates, errors} = validateStudentUpdates(existing, input);
    if ('branch' in updates && !Object.values(DEPARTMENTS).some(d => d.code !== 'ALL' && d.aliases.includes(updates.branch))) errors.branch = 'Please select a valid department.';
    if ('branch' in updates && !canAccessStudent(decoded.dept, updates.branch)) return res.status(403).json({success:false, message:'Access denied.'});
    if (Object.keys(errors).length) return res.status(400).json({success:false, message:Object.values(errors).join(' '), errors});
    if (!Object.keys(updates).length) return res.json({success:true, student:existing});

    // 4. Update Database
    const updatedStudent = await db.updateStudent(id, updates);
    if (updatedStudent) {
      return res.status(200).json({ success: true, message: 'Student updated successfully.', student: updatedStudent });
    } else {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
  } catch (error: any) {
    if (error instanceof SyntaxError) return res.status(400).json({success:false, message:'Invalid request body.'});
    
    // 5. Handle Unique Constraint Violations
    if (error.code === '23505') {
      return res.status(400).json({ 
        success: false, 
        message: 'That Roll Number or Email is already in use by another student.' 
      });
    }
    
    return res.status(500).json({ success: false, message: 'Failed to update student in the database.' });
  }
}
