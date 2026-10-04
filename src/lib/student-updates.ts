import { calculateBtechPercentageFromCgpa, calculatePercentageFromCgpa, validateStudentForm } from './validation.js';
import type { StudentFormData } from '../types/student.js';

export const studentFields = {
  first_name: 'firstName', last_name: 'lastName', roll_number: 'rollNumber', date_of_birth: 'dateOfBirth',
  gender: 'gender', email: 'email', mobile_number: 'mobileNumber', aadhar_number: 'aadharNumber',
  pan_number: 'panNumber', passport_number: 'passportNumber', college: 'college', branch: 'branch', other_branch: 'otherBranch',
  cgpa: 'cgpa', percentage: 'percentage', active_backlogs: 'activeBacklogs', crt_registration: 'crtRegistration',
  intermediate_or_diploma: 'intermediateOrDiploma', intermediate_cgpa: 'intermediateCgpa', intermediate_percentage: 'intermediatePercentage',
  diploma_cgpa: 'diplomaCgpa', diploma_percentage: 'diplomaPercentage', intermediate_year_of_passing: 'intermediateYearOfPassing',
  btech_year_of_passing: 'btechYearOfPassing', tenth_cgpa: 'tenthCgpa', tenth_percentage: 'tenthPercentage', tenth_year_of_passing: 'tenthYearOfPassing',
  linkedin_link: 'linkedinLink', resume_link: 'resumeLink', github_link: 'githubLink', hackerrank_link: 'hackerrankLink',
  leetcode_link: 'leetcodeLink', codechef_link: 'codechefLink', codeforces_link: 'codeforcesLink',
} as const;

/** Validate only the patch and its dependencies; unrelated legacy gaps remain untouched. */
export function validateStudentUpdates(existing: Record<string, any>, input: unknown) {
  const errors: Record<string, string> = {};
  const updates: Record<string, any> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {updates, errors: {general: 'Updates must be an object.'}};
  for (const [key, value] of Object.entries(input)) {
    if (!Object.hasOwn(studentFields, key)) { errors[key] = 'This field cannot be edited.'; continue; }
    if (value !== null && typeof value !== 'string' && typeof value !== 'number') { errors[key] = 'Invalid field value.'; continue; }
    if (String(value ?? '') === String(existing[key] ?? '')) continue;
    updates[key] = value;
  }
  for (const key of ['first_name', 'last_name']) {
    if (key in updates) updates[key] = String(updates[key] ?? '').trim().toUpperCase();
  }
  for (const [cgpa, pct] of [['cgpa', 'percentage'], ['tenth_cgpa', 'tenth_percentage'], ['intermediate_cgpa', 'intermediate_percentage'], ['diploma_cgpa', 'diploma_percentage']]) {
    if (cgpa in updates || pct in updates) {
      const value = cgpa in updates ? updates[cgpa] : existing[cgpa];
      if (value === null || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 10) errors[cgpa] = 'CGPA must be between 0 and 10.';
      else {
        if (cgpa in updates) updates[cgpa] = Number(value);
        updates[pct] = cgpa === 'cgpa' ? calculateBtechPercentageFromCgpa(Number(value)) : calculatePercentageFromCgpa(Number(value));
      }
    }
  }
  const merged = {...existing, ...updates};
  const form: Record<string, any> = {};
  for (const [dbKey, formKey] of Object.entries(studentFields)) form[formKey] = String(merged[dbKey] ?? '');
  form.activeBacklogs = merged.active_backlogs === '' || merged.active_backlogs == null ? NaN : Number(merged.active_backlogs);
  const validation = validateStudentForm(form as StudentFormData, true).errors;
  const affected = new Set(Object.keys(updates).map(k => studentFields[k as keyof typeof studentFields] as string));
  if (affected.has('branch') || affected.has('otherBranch')) affected.add('otherBranch');
  if (affected.has('intermediateOrDiploma')) {
    for (const key of ['intermediateCgpa','intermediatePercentage','diplomaCgpa','diplomaPercentage','intermediateYearOfPassing']) affected.add(key);
  }
  if (['tenthYearOfPassing','intermediateYearOfPassing','btechYearOfPassing','dateOfBirth'].some(k => affected.has(k))) {
    for (const key of ['tenthYearOfPassing','intermediateYearOfPassing','btechYearOfPassing']) if (form[key]) affected.add(key);
  }
  for (const [key, error] of Object.entries(validation)) if (error && affected.has(key)) errors[key] = error;
  // Changing the email cannot transfer the old email's verification status.
  if ('email' in updates) updates.email_verified = false;
  return {updates, errors};
}
