import { db } from '../../server/db.js';
import { extractFacultySession, facultyFilter, generateStudentsExcelBuffer } from '../../server/faculty.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'Method not allowed' });
  const session = extractFacultySession(req);
  if (!session) return res.status(401).json({ success: false, message: 'Unauthorized' });
  try {
    const students = await db.listStudents(facultyFilter(session.dept, req.query));
    const buffer = generateStudentsExcelBuffer(students, session.dept);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Disposition', 'attachment; filename="Students_Export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch {
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
}
