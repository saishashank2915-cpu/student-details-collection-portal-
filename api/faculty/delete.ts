import { db } from '../../server/db.js';
import { verifyFacultyToken } from '../../server/faculty.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyFacultyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }

  try {
    const { id } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    // Call the delete method from your db class
    const deleted = await db.deleteStudent(id); 
    
    if (deleted) {
      return res.status(200).json({ success: true, message: 'Student deleted successfully.' });
    } else {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
  } catch (error: any) {
    console.error('Delete Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
}
