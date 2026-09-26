import { db } from '../../server/db.js';
import { getDepartmentAliases, verifyFacultyToken, generateStudentsExcelBuffer } from '../../server/faculty.js';

function extractSession(req: any): { dept: string } | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query?.token) {
    token = req.query.token;
  }
  if (!token) return null;
  return verifyFacultyToken(token);
}

export default async function handler(req: any, res: any) {
  const session = extractSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in to download reports.' });
  }

  const { branch, search } = req.query || {};
  let targetBranches: string[] | undefined;
  const effectiveDeptCode = session.dept === 'ALL'
    ? (typeof branch === 'string' && branch && branch !== 'ALL' ? branch : 'ALL')
    : session.dept;

  if (effectiveDeptCode !== 'ALL') {
    targetBranches = getDepartmentAliases(effectiveDeptCode);
  }

  try {
    const students = await db.listStudents({
      branch: targetBranches,
      search: typeof search === 'string' && search ? search : undefined,
    });

    const excelBuffer = generateStudentsExcelBuffer(students, effectiveDeptCode);
    const safeDept = effectiveDeptCode.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `AVN_Students_${safeDept}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(excelBuffer);
  } catch (error: any) {
    console.error('Error in Vercel /api/faculty/export:', error);
    return res.status(500).json({ success: false, message: 'Failed to export Excel spreadsheet.' });
  }
}
