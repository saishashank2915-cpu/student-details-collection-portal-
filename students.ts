import { db } from '../../server/db.js';
import { DEPARTMENTS, getDepartmentAliases, verifyFacultyToken } from '../../server/faculty.js';

function extractSession(req: any): { dept: string } | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.method === 'GET' && typeof req.query?.token === 'string') {
    token = req.query.token;
  }
  if (!token) return null;
  return verifyFacultyToken(token);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }
  const session = extractSession(req);
  if (!session || !Object.prototype.hasOwnProperty.call(DEPARTMENTS, session.dept)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in to faculty portal.' });
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ success: false, message: 'A valid student ID is required.' });
    }
    try {
      // Authorization is included in the DELETE query, independent of client filters.
      const allowedBranches = session.dept === 'ALL' ? null : getDepartmentAliases(session.dept);
      const deleted = await db.deleteStudent(id.toLowerCase(), allowedBranches);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Student not found or outside your department.' });
      }
      return res.json({ success: true, id, message: 'Student registration deleted.' });
    } catch (error: any) {
      console.error('Failed to delete student:', error.code || 'database_error');
      return res.status(500).json({ success: false, message: 'Could not delete the student. Please try again.' });
    }
  }

  const { branch, search } = req.query || {};
  let targetBranches: string[] | undefined;
  if (session.dept === 'ALL') {
    if (typeof branch === 'string' && branch && branch !== 'ALL') {
      targetBranches = getDepartmentAliases(branch);
    }
  } else {
    targetBranches = getDepartmentAliases(session.dept);
  }

  try {
    const students = await db.listStudents({
      branch: targetBranches,
      search: typeof search === 'string' && search ? search : undefined,
    });

    return res.json({
      success: true,
      department: session.dept,
      departmentName: DEPARTMENTS[session.dept]?.name || session.dept,
      count: students.length,
      students,
    });
  } catch (error: any) {
    console.error('Error in Vercel /api/faculty/students:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve students.' });
  }
}
