import { db } from '../../server/db.js';
import * as XLSX from 'xlsx';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  try {
    const branch = req.query.branch as string;
    const yop = req.query.yop as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (branch && branch !== 'ALL') filter.branch = branch;
    if (yop && yop !== 'ALL') filter.yop = yop;
    if (search) filter.search = search;

    const students = await db.listStudents(filter);

    // FIX: Stitch First and Last name together for the Excel export
    const exportData = students.map((s: any, idx: number) => ({
      'S.No': idx + 1,
      'Roll Number / Hall Ticket': s.roll_number,
      'Full Name': `${s.first_name || ''} ${s.last_name || ''}`.trim() || '-',
      'First Name': s.first_name || '-',
      'Last Name': s.last_name || '-',
      'Department / Branch': s.branch === 'Other' && s.other_branch ? `${s.branch} (${s.other_branch})` : s.branch,
      'Academic Session': '2026–2027',
      'College / Institution': s.college,
      'Email Address': s.email,
      'Mobile Number': `+91 ${s.mobile_number}`,
      'Aadhaar Number': s.aadhar_number || '-',
      'PAN Number': s.pan_number || '-',
      'Passport Number': s.passport_number || '-',
      'Date of Birth': s.date_of_birth,
      'Gender': s.gender,
      'CGPA (0-10)': Number(s.cgpa || 0),
      'Percentage (%)': `${Number(s.percentage || 0)}%`,
      'Active Backlogs': Number(s.active_backlogs || 0),
      'CRT Registration': s.crt_registration || '-',
      'Submission Date': s.created_at ? new Date(s.created_at).toLocaleString() : '',
      'Submission ID': s.id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Students_Export.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ success: false, message: 'Export failed' });
  }
}
