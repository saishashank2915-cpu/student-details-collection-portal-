import { db } from '../../server/db.js';
import { DEPARTMENTS, extractFacultySession, facultyFilter } from '../../server/faculty.js';
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({success: false, message: 'Method not allowed'});
  const session = extractFacultySession(req);
  if (!session) return res.status(401).json({success: false, message: 'Unauthorized. Please log in again.'});
  try {
    const students = await db.listStudents(facultyFilter(session.dept, req.query));
    res.setHeader('Cache-Control', 'no-store');
    return res.json({success: true, department: session.dept, departmentName: DEPARTMENTS[session.dept].name, count: students.length, students});
  } catch {
    return res.status(500).json({success: false, message: 'Failed to retrieve students.'});
  }
}
