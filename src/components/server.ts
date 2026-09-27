import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, isPostgresConfigured } from './server/db.js';
import { requestEmailOtp, verifyEmailOtp, validateVerificationToken, consumeVerificationToken } from './server/otp.js';
import { isSupabaseAuthConfigured } from './server/supabase-auth.js';
import {
  calculatePercentageFromCgpa,
  verifyCgpaPercentageMatch,
  validateEmail,
  validateMobileNumber,
  validateRollNumber
} from './src/lib/validation.js';
import {
  DEPARTMENTS,
  getDepartmentAliases,
  verifyFacultyCredentials,
  createFacultyToken,
  verifyFacultyToken,
  generateStudentsExcelBuffer
} from './server/faculty.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API: System Status
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    databaseConfigured: isPostgresConfigured(),
    databaseType: isPostgresConfigured() ? 'Supabase PostgreSQL' : 'Memory Database (Fallback)',
    supabaseAuthConfigured: isSupabaseAuthConfigured(),
  });
});

// API: Send Email OTP
app.post('/api/otp/send', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      return;
    }

    const result = await requestEmailOtp(email);
    res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
    });
  } catch (error: any) {
    console.error('Error in /api/otp/send:', error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again.' });
  }
});

// API: Verify Email OTP
app.post('/api/otp/verify', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and OTP are both required.' });
      return;
    }

    const result = await verifyEmailOtp(email, otp);
    res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      verified: result.success,
      verificationToken: result.verificationToken,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (error: any) {
    console.error('Error in /api/otp/verify:', error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred during verification.' });
  }
});

// API: Submit Student Details
app.post('/api/students/submit', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      rollNumber,
      dateOfBirth,
      gender,
      email,
      verificationToken,
      mobileNumber,
      college,
      branch,
      otherBranch,
      cgpa,
      percentage,
      activeBacklogs,
      intermediateOrDiploma,
      intermediateCgpa,
      intermediatePercentage,
      diplomaCgpa,
      diplomaPercentage,
      intermediateYearOfPassing,
      btechYearOfPassing,
      tenthCgpa,
      tenthPercentage,
      tenthYearOfPassing,
    } = req.body;

    const errors: Record<string, string> = {};

    // 1. Verify Full Name
    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    if (!trimmedName) {
      errors.fullName = 'Full name is required.';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.fullName = 'Full name must be between 2 and 100 characters.';
    }

    // 2. Verify Roll Number
    const rollError = validateRollNumber(rollNumber || '');
    if (rollError) {
      errors.rollNumber = rollError;
    }

    // 3. Verify Date of Birth
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required.';
    } else {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(dob.getTime()) || dob > today) {
        errors.dateOfBirth = 'Date of birth cannot be a future date.';
      }
    }

    // 4. Verify Gender
    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      errors.gender = 'Please select a valid gender option.';
    }

    // 5. Verify Email & Verification Token
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const emailError = validateEmail(cleanEmail);
    if (emailError) {
      errors.email = emailError;
    } else {
      // Must have verified token
      if (!verificationToken || typeof verificationToken !== 'string') {
        errors.email = 'Please verify your email before submitting.';
      } else {
        const isTokenValid = await validateVerificationToken(cleanEmail, verificationToken);
        if (!isTokenValid) {
          errors.email = 'Email verification has expired or is invalid. Please verify again.';
        }
      }
    }

    // 6. Verify Mobile Number
    const mobileError = validateMobileNumber(mobileNumber || '');
    if (mobileError) {
      errors.mobileNumber = mobileError;
    }

    // 7. Verify College
    const trimmedCollege = typeof college === 'string' ? college.trim() : '';
    if (!trimmedCollege) {
      errors.college = 'College / Institution is required.';
    } else if (trimmedCollege.length > 200) {
      errors.college = 'College name cannot exceed 200 characters.';
    }

    // 8. Verify Branch
    const validBranches = [
      'Computer Science & Engineering (CSE)',
      'CSE – Artificial Intelligence & Machine Learning (AI & ML)',
      'CSE – Data Science (DS)',
      'CSE – Cyber Security (CS)',
      'Artificial Intelligence & Data Science (AI & DS)',
      'Electronics & Communication Engineering (ECE)',
      'Civil Engineering (CE)',
      'Mechanical Engineering (ME)',
      'Other',
      'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI & ML', 'AI & DS', 'CE', 'ME'
    ];
    if (!branch || !validBranches.includes(branch)) {
      errors.branch = 'Please select your branch.';
    } else if (branch === 'Other' && (!otherBranch || !otherBranch.trim())) {
      errors.otherBranch = 'Please specify your branch/department.';
    }

    // 10. Verify CGPA & Percentage
    const numCgpa = parseFloat(cgpa);
    const numPct = parseFloat(percentage);

    if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
      errors.cgpa = 'CGPA must be between 0 and 10.';
    }

    if (isNaN(numPct) || numPct < 0 || numPct > 100) {
      errors.percentage = 'Percentage must be between 0 and 100.';
    }

    if (!errors.cgpa && !errors.percentage) {
      if (!verifyCgpaPercentageMatch(numCgpa, numPct)) {
        errors.cgpaPercentageMatch = 'CGPA and Percentage do not match. Please check the values.';
      }
    }

    // 11. Verify Active Backlogs
    const numBacklogs = Number(activeBacklogs);
    if (activeBacklogs === undefined || activeBacklogs === null || isNaN(numBacklogs)) {
      errors.activeBacklogs = 'Active backlogs is required.';
    } else if (!Number.isInteger(numBacklogs) || numBacklogs < 0) {
      errors.activeBacklogs = 'Active backlogs cannot be negative.';
    }

    // 12. Verify Intermediate / Diploma
    if (!intermediateOrDiploma || !['Intermediate', 'Diploma'].includes(intermediateOrDiploma)) {
      errors.intermediateOrDiploma = 'Please select either Intermediate or Diploma.';
    }

    // 13. Verify Intermediate / Diploma CGPA, percentage and year of passing
    if (intermediateOrDiploma === 'Intermediate') {
      const intNum = parseFloat(intermediateCgpa);
      const intPct = parseFloat(intermediatePercentage);
      if (isNaN(intNum) || intNum < 0 || intNum > 10) errors.intermediateCgpa = 'Intermediate CGPA must be between 0 and 10.';
      if (isNaN(intPct) || !verifyCgpaPercentageMatch(intNum, intPct)) errors.intermediatePercentage = 'Intermediate percentage does not match the CGPA calculation.';
      if (!intermediateYearOfPassing) errors.intermediateYearOfPassing = 'Intermediate Year of Passing is required.';
    } else if (intermediateOrDiploma === 'Diploma') {
      const dipNum = parseFloat(diplomaCgpa);
      const dipPct = parseFloat(diplomaPercentage);
      if (isNaN(dipNum) || dipNum < 0 || dipNum > 10) errors.diplomaCgpa = 'Diploma CGPA must be between 0 and 10.';
      if (isNaN(dipPct) || !verifyCgpaPercentageMatch(dipNum, dipPct)) errors.diplomaPercentage = 'Diploma percentage does not match the CGPA calculation.';
      if (!intermediateYearOfPassing) errors.intermediateYearOfPassing = 'Diploma Year of Passing is required.';
    }

    // 14. Verify 10th CGPA, percentage and year of passing
    const tenthNum = parseFloat(tenthCgpa);
    const tenthPct = parseFloat(tenthPercentage);
    if (isNaN(tenthNum) || tenthNum < 0 || tenthNum > 10) errors.tenthCgpa = '10th CGPA must be between 0 and 10.';
    if (isNaN(tenthPct) || !verifyCgpaPercentageMatch(tenthNum, tenthPct)) errors.tenthPercentage = '10th percentage does not match the CGPA calculation.';
    if (!tenthYearOfPassing) errors.tenthYearOfPassing = '10th Year of Passing is required.';

    // 15. Verify B.Tech Year of Passing (YOP)
    if (!btechYearOfPassing || typeof btechYearOfPassing !== 'string' || !btechYearOfPassing.trim()) {
      errors.btechYearOfPassing = 'Please select your B.Tech Year of Passing.';
    }

    // Check if there are any validation errors
    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        message: 'Please resolve all validation errors before submitting.',
        errors,
      });
      return;
    }

    // 16. Check duplicate roll number in database
    const normalizedRoll = rollNumber.trim().toUpperCase();
    const existingStudent = await db.findStudentByRollNumber(normalizedRoll);
    if (existingStudent) {
      res.status(400).json({
        success: false,
        message: 'This roll number has already been registered.',
        errors: {
          rollNumber: 'This roll number has already been registered.',
        },
      });
      return;
    }

    // 17. Insert Student into Database
    try {
      const student = await db.insertStudent({
        fullName: trimmedName,
        rollNumber: normalizedRoll,
        dateOfBirth,
        gender,
        email: cleanEmail,
        emailVerified: true,
        mobileNumber: mobileNumber.trim(),
        college: trimmedCollege,
        branch,
        otherBranch: branch === 'Other' ? otherBranch.trim() : null,
        cgpa: numCgpa,
        percentage: numPct,
        activeBacklogs: numBacklogs,
        intermediateOrDiploma: intermediateOrDiploma || null,
        intermediateCgpa: intermediateOrDiploma === 'Intermediate' && !isNaN(parseFloat(intermediateCgpa)) ? parseFloat(intermediateCgpa) : null,
        intermediatePercentage: intermediateOrDiploma === 'Intermediate' && !isNaN(parseFloat(intermediatePercentage)) ? parseFloat(intermediatePercentage) : null,
        diplomaCgpa: intermediateOrDiploma === 'Diploma' && !isNaN(parseFloat(diplomaCgpa)) ? parseFloat(diplomaCgpa) : null,
        diplomaPercentage: intermediateOrDiploma === 'Diploma' && !isNaN(parseFloat(diplomaPercentage)) ? parseFloat(diplomaPercentage) : null,
        intermediateYearOfPassing: intermediateYearOfPassing ? String(intermediateYearOfPassing).trim() : null,
        btechYearOfPassing: btechYearOfPassing ? String(btechYearOfPassing).trim() : null,
        tenthCgpa: !isNaN(parseFloat(tenthCgpa)) ? parseFloat(tenthCgpa) : null,
        tenthPercentage: !isNaN(parseFloat(tenthPercentage)) ? parseFloat(tenthPercentage) : null,
        tenthYearOfPassing: tenthYearOfPassing ? String(tenthYearOfPassing).trim() : null,
      });

      // 14. Consume the verification token (single-use)
      await consumeVerificationToken(cleanEmail, verificationToken);

      res.status(201).json({
        success: true,
        message: 'Your student details have been submitted successfully.',
        submissionId: student.id,
        student: {
          name: student.full_name,
          rollNumber: student.roll_number,
          email: student.email,
          submissionId: student.id,
        },
      });
    } catch (dbError: any) {
      if (dbError.code === '23505') {
        res.status(400).json({
          success: false,
          message: 'This roll number has already been registered.',
          errors: {
            rollNumber: 'This roll number has already been registered.',
          },
        });
        return;
      }
      console.error('Database error inserting student:', dbError);
      res.status(500).json({
        success: false,
        message: 'Failed to save student details. Please try again.',
      });
    }
  } catch (error: any) {
    console.error('Error in /api/students/submit:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
});

// ==========================================
// FACULTY API ROUTES (Dept-wise & Excel Export)
// ==========================================

// Helper: Extract & Verify Faculty Session
function extractFacultySession(req: Request): { dept: string } | null {
  const authHeader = req.headers.authorization;
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }
  if (!token) return null;
  return verifyFacultyToken(token);
}

// 1. Get Departments List
app.get('/api/faculty/departments', (_req: Request, res: Response) => {
  const depts = Object.values(DEPARTMENTS).map((d) => ({
    code: d.code,
    name: d.name,
  }));
  res.json({ success: true, departments: depts });
});

// 2. Faculty Login
app.post('/api/faculty/login', (req: Request, res: Response) => {
  const { department, password } = req.body;
  if (!department || !password) {
    res.status(400).json({ success: false, message: 'Department and password are required.' });
    return;
  }

  const isValid = verifyFacultyCredentials(department, password);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid department password. Please check your credentials.' });
    return;
  }

  const token = createFacultyToken(department);
  res.json({
    success: true,
    message: 'Faculty logged in successfully.',
    token,
    department,
    departmentName: DEPARTMENTS[department]?.name || department,
  });
});

// 3. Faculty: Query Students (Department Scoped)
app.get('/api/faculty/students', async (req: Request, res: Response) => {
  try {
    const session = extractFacultySession(req);
    if (!session) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please log in to faculty portal.' });
      return;
    }

    const { branch, search } = req.query;
    let targetBranches: string[] | undefined;
    if (session.dept === 'ALL') {
      if (typeof branch === 'string' && branch && branch !== 'ALL') {
        targetBranches = getDepartmentAliases(branch);
      }
    } else {
      targetBranches = getDepartmentAliases(session.dept);
    }

    const students = await db.listStudents({
      branch: targetBranches,
      search: typeof search === 'string' && search ? search : undefined,
    });

    res.json({
      success: true,
      department: session.dept,
      departmentName: DEPARTMENTS[session.dept]?.name || session.dept,
      count: students.length,
      students,
    });
  } catch (error: any) {
    console.error('Error in /api/faculty/students:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve department students.' });
  }
});

// 4. Faculty: Export Students to Excel (.xlsx)
app.get('/api/faculty/export', async (req: Request, res: Response) => {
  try {
    const session = extractFacultySession(req);
    if (!session) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please log in to download reports.' });
      return;
    }

    const { branch, search } = req.query;
    let targetBranches: string[] | undefined;
    const effectiveDeptCode = session.dept === 'ALL'
      ? (typeof branch === 'string' && branch && branch !== 'ALL' ? branch : 'ALL')
      : session.dept;

    if (effectiveDeptCode !== 'ALL') {
      targetBranches = getDepartmentAliases(effectiveDeptCode);
    }

    const students = await db.listStudents({
      branch: targetBranches,
      search: typeof search === 'string' && search ? search : undefined,
    });

    const excelBuffer = generateStudentsExcelBuffer(students, effectiveDeptCode);
    const safeDept = effectiveDeptCode.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `AVN_Students_${safeDept}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.send(excelBuffer);
  } catch (error: any) {
    console.error('Error in /api/faculty/export:', error);
    res.status(500).json({ success: false, message: 'Failed to export Excel spreadsheet.' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
