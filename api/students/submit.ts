import { db } from '../../server/db.js';
import { validateVerificationToken, consumeVerificationToken } from '../../server/otp.js';
import { validateStudentForm } from '../../src/lib/validation.js';
import { studentFields } from '../../src/lib/student-updates.js';
import { DEPARTMENTS } from '../../server/faculty.js';
import type { StudentFormData } from '../../src/types/student.js';
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({success: false, message: 'Method not allowed'});
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({success:false, message:'Invalid submission.'});
    const data: any = {};
    for (const key of Object.values(studentFields)) data[key] = typeof body[key] === 'string' || typeof body[key] === 'number' ? String(body[key]).trim() : '';
    data.firstName = data.firstName.toUpperCase();
    data.lastName = data.lastName.toUpperCase();
    data.rollNumber = data.rollNumber.toUpperCase();
    data.email = data.email.toLowerCase();
    data.activeBacklogs = data.activeBacklogs === '' ? NaN : Number(data.activeBacklogs);
    const {errors} = validateStudentForm(data as StudentFormData, true);
    if (!Object.values(DEPARTMENTS).some(d => d.code !== 'ALL' && d.aliases.includes(data.branch))) errors.branch = 'Please select a valid department.';
    if (Object.keys(errors).length) return res.status(400).json({success:false, message:'Please resolve the validation errors.', errors});
    if (typeof body.verificationToken !== 'string' || !await validateVerificationToken(data.email, body.verificationToken)) return res.status(400).json({success:false, message:'Please verify your email again.', errors:{email:'Email verification has expired or is invalid.'}});
    if (await db.findStudentByRollNumber(data.rollNumber)) return res.status(400).json({success:false, message:'This roll number has already been registered.', errors:{rollNumber:'This roll number has already been registered.'}});
    for (const key of ['cgpa','percentage','tenthCgpa','tenthPercentage']) data[key] = Number(data[key]);
    for (const key of ['intermediateCgpa','intermediatePercentage','diplomaCgpa','diplomaPercentage']) data[key] = data[key] === '' ? null : Number(data[key]);
    if (data.intermediateOrDiploma === 'Intermediate') { data.diplomaCgpa = null; data.diplomaPercentage = null; }
    else { data.intermediateCgpa = null; data.intermediatePercentage = null; }
    data.emailVerified = true;
    const student = await db.insertStudent(data);
    await consumeVerificationToken(data.email, body.verificationToken);
    return res.status(201).json({success:true, message:'Your student details have been submitted successfully.', submissionId:student.id, student:{name:`${student.first_name} ${student.last_name}`.trim(), rollNumber:student.roll_number, email:student.email, submissionId:student.id}});
  } catch (error: any) {
    if (error instanceof SyntaxError) return res.status(400).json({success:false, message:'Invalid submission.'});
    if (error.code === '23505') return res.status(400).json({success:false, message:'This roll number or email is already registered.'});
    return res.status(500).json({success:false, message:'Failed to save student details. Please try again.'});
  }
}
