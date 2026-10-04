import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { db, type StudentDbRow } from './db.js';

const FACULTY_SECRET = process.env.FACULTY_JWT_SECRET || '';

export interface DepartmentInfo {
  code: string;
  name: string;
  aliases: string[];
}

export const DEPARTMENTS: Record<string, DepartmentInfo> = {
  ALL: {
    code: 'ALL',
    name: 'All Departments (Dean / Admin)',
    aliases: [],
  },
  CSE: {
    code: 'CSE',
    name: 'Computer Science & Engineering (CSE)',
    aliases: ['Computer Science & Engineering (CSE)', 'CSE'],
  },
  'CSE-AIML': {
    code: 'CSE-AIML',
    name: 'CSE – Artificial Intelligence & Machine Learning (AI & ML)',
    aliases: [
      'CSE – Artificial Intelligence & Machine Learning (AI & ML)',
      'CSE – Artificial Intelligence & Machine Learning',
      'CSE – Artificial Intelligence & Machine Learning (AI & ML)'.substring(0, 48),
      'AI & ML',
      'CSE-AIML',
    ],
  },
  'CSE-DS': {
    code: 'CSE-DS',
    name: 'CSE – Data Science (DS)',
    aliases: ['CSE – Data Science (DS)', 'CSE-DS', 'DS'],
  },
  'CSE-CS': {
    code: 'CSE-CS',
    name: 'CSE – Cyber Security (CS)',
    aliases: ['CSE – Cyber Security (CS)', 'CSE-CS', 'CS'],
  },
  'AI-DS': {
    code: 'AI-DS',
    name: 'Artificial Intelligence & Data Science (AI & DS)',
    aliases: [
      'Artificial Intelligence & Data Science (AI & DS)',
      'AI & DS',
      'AI-DS',
    ],
  },
  ECE: {
    code: 'ECE',
    name: 'Electronics & Communication Engineering (ECE)',
    aliases: ['Electronics & Communication Engineering (ECE)', 'ECE'],
  },
  CE: {
    code: 'CE',
    name: 'Civil Engineering (CE)',
    aliases: ['Civil Engineering (CE)', 'CIVIL', 'CE'],
  },
  ME: {
    code: 'ME',
    name: 'Mechanical Engineering (ME)',
    aliases: ['Mechanical Engineering (ME)', 'MECH', 'ME'],
  },
  Other: {
    code: 'Other',
    name: 'Other Departments',
    aliases: ['Other'],
  },
};

/**
 * Get all branch aliases for a department code
 */
export function getDepartmentAliases(departmentCode: string): string[] {
  const dept = DEPARTMENTS[departmentCode];
  if (!dept) return [departmentCode];
  return dept.aliases.length > 0 ? dept.aliases : [dept.name];
}

/**
 * Verify department credentials
 */
export function verifyFacultyCredentials(department: string, pass: string): boolean {
  const dept = DEPARTMENTS[department];
  if (!Object.hasOwn(DEPARTMENTS, department)) return false;

  const expected = process.env[`FACULTY_PASSWORD_${department.replace(/-/g, '_').toUpperCase()}`];
  if (!FACULTY_SECRET || !expected || typeof pass !== 'string') return false;
  const actualHash = crypto.createHash('sha256').update(pass).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

/**
 * Create signed faculty session token
 */
export function createFacultyToken(department: string): string {
  if (!FACULTY_SECRET || !Object.hasOwn(DEPARTMENTS, department)) throw new Error('Faculty authentication is not configured.');
  const payload = {
    dept: department,
    exp: Date.now() + 12 * 60 * 60 * 1000, // 12 hours
    iat: Date.now(),
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', FACULTY_SECRET).update(str).digest('base64url');
  return `${str}.${sig}`;
}

/**
 * Verify faculty session token
 */
export function verifyFacultyToken(token: string): { dept: string } | null {
  if (!FACULTY_SECRET || typeof token !== 'string' || token.split('.').length !== 2) return null;
  const [str, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', FACULTY_SECRET).update(str).digest('base64url');

  if (!/^[A-Za-z0-9_-]{43}$/.test(sig) || sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

  try {
    const payload = JSON.parse(Buffer.from(str, 'base64url').toString('utf8'));
    if (!Number.isFinite(payload.exp) || payload.exp <= Date.now() || typeof payload.dept !== 'string' || !Object.hasOwn(DEPARTMENTS, payload.dept)) return null;
    return { dept: payload.dept };
  } catch {
    return null;
  }
}

/**
 * Generate Excel workbook buffer from student records
 */
export function generateStudentsExcelBuffer(students: StudentDbRow[], department: string): Buffer {
  const data = students.map((s, idx) => ({
    'S.No': idx + 1,
    'Roll Number / Hall Ticket': s.roll_number,
    'Full Name': `${s.first_name || ''} ${s.last_name || ''}`.trim(),
    'First Name': s.first_name,
    'Last Name': s.last_name,
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
    'B.Tech CGPA (0-10)': Number(s.cgpa),
    'B.Tech Percentage (%)': `${Number(s.percentage)}%`,
    'B.Tech Year of Passing (YOP)': s.btech_year_of_passing || '-',
    'Intermediate / Diploma': s.intermediate_or_diploma || '-',
    'Inter / Diploma CGPA': s.intermediate_or_diploma === 'Intermediate'
      ? (s.intermediate_cgpa !== null && s.intermediate_cgpa !== undefined ? Number(s.intermediate_cgpa) : '-')
      : (s.intermediate_or_diploma === 'Diploma'
          ? (s.diploma_cgpa !== null && s.diploma_cgpa !== undefined ? Number(s.diploma_cgpa) : '-')
          : '-'),
    'Inter / Diploma Percentage (%)': s.intermediate_or_diploma === 'Intermediate'
      ? (s.intermediate_percentage !== null && s.intermediate_percentage !== undefined ? `${Number(s.intermediate_percentage)}%` : '-')
      : (s.intermediate_or_diploma === 'Diploma'
          ? (s.diploma_percentage !== null && s.diploma_percentage !== undefined ? `${Number(s.diploma_percentage)}%` : '-')
          : '-'),
    'Inter / Diploma Year of Passing': s.intermediate_year_of_passing || '-',
    '10th CGPA': s.tenth_cgpa !== null && s.tenth_cgpa !== undefined ? Number(s.tenth_cgpa) : '-',
    '10th Percentage (%)': s.tenth_percentage !== null && s.tenth_percentage !== undefined ? `${Number(s.tenth_percentage)}%` : '-',
    '10th Year of Passing': s.tenth_year_of_passing || '-',
    'Active Backlogs': Number(s.active_backlogs),
    'CRT Registration': s.crt_registration || '-',
    'Submission Date': s.created_at ? new Date(s.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '',
    'Submission ID': s.id,
    'LinkedIn': s.linkedin_link || '',
    'Resume': s.resume_link || '',
    'GitHub': s.github_link || '',
    'HackerRank': s.hackerrank_link || '',
    'LeetCode': s.leetcode_link || '',
    'CodeChef': s.codechef_link || '',
    'Codeforces': s.codeforces_link || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Roll Number
    { wch: 25 }, // Full Name
    { wch: 32 }, // Department
    { wch: 18 }, // Academic Session
    { wch: 35 }, // College
    { wch: 28 }, // Email
    { wch: 16 }, // Mobile
    { wch: 14 }, // DOB
    { wch: 10 }, // Gender
    { wch: 12 }, // CGPA
    { wch: 15 }, // Percentage
    { wch: 15 }, // Backlogs
    { wch: 22 }, // Date
    { wch: 38 }, // ID
  ];

  const workbook = XLSX.utils.book_new();
  const sheetName = department === 'ALL' ? 'All_Students' : `${department.replace(/[^a-zA-Z0-9]/g, '_')}_Students`;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function extractFacultySession(req: any): { dept: string } | null {
  const header = req.headers?.authorization;
  return typeof header === 'string' && header.startsWith('Bearer ')
    ? verifyFacultyToken(header.slice(7)) : null;
}

export function facultyFilter(dept: string, query: Record<string, unknown> = {}) {
  const target = dept === 'ALL' && typeof query.branch === 'string' ? query.branch : dept;
  return {
    branch: target === 'ALL' ? undefined : getDepartmentAliases(target),
    yop: typeof query.yop === 'string' && query.yop !== 'ALL' ? query.yop : undefined,
    search: typeof query.search === 'string' ? query.search.trim() : undefined,
  };
}

export function canAccessStudent(dept: string, branch: string): boolean {
  return dept === 'ALL' || getDepartmentAliases(dept).includes(branch);
}
