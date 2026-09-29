import type { StudentFormData } from '../types/student.js';

export interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  rollNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  email?: string;
  otp?: string;
  mobileNumber?: string;
  aadharNumber?: string;
  panNumber?: string;
  passportNumber?: string;
  crtRegistration?: string;
  college?: string;
  branch?: string;
  otherBranch?: string;
  cgpa?: string;
  percentage?: string;
  cgpaPercentageMatch?: string;
  activeBacklogs?: string;
  intermediateOrDiploma?: string;
  intermediateCgpa?: string;
  intermediatePercentage?: string;
  diplomaCgpa?: string;
  diplomaPercentage?: string;
  intermediateYearOfPassing?: string;
  btechYearOfPassing?: string;
  tenthCgpa?: string;
  tenthPercentage?: string;
  tenthYearOfPassing?: string;
  general?: string;
  [key: string]: string | undefined;
}

/** B.Tech formula: Percentage = CGPA × 10 − 5 */
export function calculateBtechPercentageFromCgpa(cgpa: number): number {
  const percentage = (cgpa * 10) - 5;
  return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
}

/** Intermediate / Diploma / 10th formula: Percentage = CGPA × 10 */
export function calculatePercentageFromCgpa(cgpa: number): number {
  const percentage = cgpa * 10;
  return Math.max(0, Math.min(100, Math.round(percentage * 100) / 100));
}

export function calculateCgpaFromPercentage(percentage: number): number {
  const cgpa = percentage / 10;
  return Math.max(0, Math.min(10, Math.round(cgpa * 100) / 100));
}

export function verifyBtechCgpaPercentageMatch(cgpa: number, percentage: number): boolean {
  if (isNaN(cgpa) || isNaN(percentage)) return false;
  return Math.abs(calculateBtechPercentageFromCgpa(cgpa) - percentage) <= 0.1;
}

export function verifyCgpaPercentageMatch(cgpa: number, percentage: number): boolean {
  if (isNaN(cgpa) || isNaN(percentage)) return false;
  return Math.abs(calculatePercentageFromCgpa(cgpa) - percentage) <= 0.1;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  // Standard RFC 5322 compliant regex for web forms
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validateMobileNumber(mobile: string): string | null {
  const cleanMobile = mobile.replace(/[\s-]/g, '');
  if (!cleanMobile) {
    return 'Mobile number is required.';
  }
  // Indian 10-digit mobile number starting with 6-9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  if (!indianMobileRegex.test(cleanMobile)) {
    return 'Please enter a valid 10-digit Indian mobile number.';
  }
  return null;
}

export function validateRollNumber(rollNumber: string): string | null {
  const trimmed = rollNumber.trim();
  if (!trimmed) {
    return 'Roll Number / Hall Ticket Number is required.';
  }
  // Alphanumeric, max 30 characters
  if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
    return 'Roll number must be alphanumeric with no spaces or special characters.';
  }
  if (trimmed.length > 30) {
    return 'Roll number cannot exceed 30 characters.';
  }
  return null;
}

export function validateStudentForm(
  data: StudentFormData,
  isEmailVerified: boolean
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  // 1. First Name
  const trimmedFirstName = (data.firstName || '').trim();
  if (!trimmedFirstName) {
    errors.firstName = 'First name is required.';
  } else if (trimmedFirstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters.';
  } else if (trimmedFirstName.length > 50) {
    errors.firstName = 'First name cannot exceed 50 characters.';
  }

  // 2. Last Name
  const trimmedLastName = (data.lastName || '').trim();
  if (!trimmedLastName) {
    errors.lastName = 'Last name is required.';
  } else if (trimmedLastName.length > 50) {
    errors.lastName = 'Last name cannot exceed 50 characters.';
  }

  // 3. Roll Number
  const rollErr = validateRollNumber(data.rollNumber);
  if (rollErr) {
    errors.rollNumber = rollErr;
  }

  // 4. Date of Birth
  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required.';
  } else {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = 'Please enter a valid date.';
    } else if (dob > today) {
      errors.dateOfBirth = 'Date of birth cannot be a future date.';
    }
  }

  // 5. Gender
  if (!data.gender) {
    errors.gender = 'Please select a gender.';
  } else if (!['Male', 'Female', 'Other'].includes(data.gender)) {
    errors.gender = 'Please select a valid gender option.';
  }

  // 6. Email & Verification
  const emailErr = validateEmail(data.email);
  if (emailErr) {
    errors.email = emailErr;
  } else if (!isEmailVerified) {
    errors.email = 'Please verify your email before submitting.';
  }

  // 7. Mobile Number
  const mobileErr = validateMobileNumber(data.mobileNumber);
  if (mobileErr) {
    errors.mobileNumber = mobileErr;
  }

  // 8. Identity documents
  const cleanAadhar = (data.aadharNumber || '').replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleanAadhar)) {
    errors.aadharNumber = 'Aadhaar number must be exactly 12 digits.';
  }
  if ((data.panNumber || '').trim() && !/^[A-Z]{5}\d{4}[A-Z]$/.test((data.panNumber || '').trim().toUpperCase())) {
    errors.panNumber = 'Please enter a valid PAN number.';
  }
  if ((data.passportNumber || '').trim() && !/^[A-Z0-9]{6,9}$/i.test((data.passportNumber || '').trim())) {
    errors.passportNumber = 'Please enter a valid Passport number.';
  }

  // 9. College / Institution
  const trimmedCollege = data.college.trim();
  if (!trimmedCollege) {
    errors.college = 'College / Institution is required.';
  } else if (trimmedCollege.length > 200) {
    errors.college = 'College name cannot exceed 200 characters.';
  }

  // 10. Branch / Department
  if (!data.branch) {
    errors.branch = 'Please select your branch.';
  } else if (data.branch === 'Other' && !data.otherBranch.trim()) {
    errors.otherBranch = 'Please specify your branch/department.';
  }

  // 11. CGPA & Percentage
  const cgpaNum = parseFloat(data.cgpa);
  const pctNum = parseFloat(data.percentage);

  if (!data.cgpa || isNaN(cgpaNum)) {
    errors.cgpa = 'CGPA is required.';
  } else if (cgpaNum < 0 || cgpaNum > 10) {
    errors.cgpa = 'CGPA must be between 0 and 10.';
  }

  if (!data.percentage || isNaN(pctNum)) {
    errors.percentage = 'Percentage is required.';
  } else if (pctNum < 0 || pctNum > 100) {
    errors.percentage = 'Percentage must be between 0 and 100.';
  }

  if (!errors.cgpa && !errors.percentage) {
    if (!verifyBtechCgpaPercentageMatch(cgpaNum, pctNum)) {
      errors.cgpaPercentageMatch = 'CGPA and Percentage do not match. Please check the values.';
    }
  }

  // 12. Active Backlogs
  if (data.activeBacklogs === undefined || data.activeBacklogs === null || isNaN(data.activeBacklogs)) {
    errors.activeBacklogs = 'Active backlogs is required.';
  } else if (!Number.isInteger(Number(data.activeBacklogs))) {
    errors.activeBacklogs = 'Active backlogs must be an integer.';
  } else if (data.activeBacklogs < 0) {
    errors.activeBacklogs = 'Active backlogs cannot be negative.';
  }

  // 13. Intermediate / Diploma Selection
  if (!data.intermediateOrDiploma) {
    errors.intermediateOrDiploma = 'Please select Intermediate or Diploma.';
  } else if (!['Intermediate', 'Diploma'].includes(data.intermediateOrDiploma)) {
    errors.intermediateOrDiploma = 'Please select a valid option (Intermediate or Diploma).';
  }

  // 14. Intermediate / Diploma CGPA, calculated percentage and year of passing
  if (data.intermediateOrDiploma === 'Intermediate') {
    const intCgpaNum = parseFloat(data.intermediateCgpa);
    const intPctNum = parseFloat(data.intermediatePercentage);
    if (!data.intermediateCgpa || isNaN(intCgpaNum) || intCgpaNum < 0 || intCgpaNum > 10) errors.intermediateCgpa = 'Intermediate CGPA must be between 0 and 10.';
    if (!data.intermediatePercentage || isNaN(intPctNum) || intPctNum < 0 || intPctNum > 100) errors.intermediatePercentage = 'Intermediate percentage must be between 0 and 100.';
    if (!data.intermediateYearOfPassing) errors.intermediateYearOfPassing = 'Intermediate Year of Passing is required.';
  } else if (data.intermediateOrDiploma === 'Diploma') {
    const dipCgpaNum = parseFloat(data.diplomaCgpa);
    const dipPctNum = parseFloat(data.diplomaPercentage);
    if (!data.diplomaCgpa || isNaN(dipCgpaNum) || dipCgpaNum < 0 || dipCgpaNum > 10) errors.diplomaCgpa = 'Diploma CGPA must be between 0 and 10.';
    if (!data.diplomaPercentage || isNaN(dipPctNum) || dipPctNum < 0 || dipPctNum > 100) errors.diplomaPercentage = 'Diploma percentage must be between 0 and 100.';
    if (!data.intermediateYearOfPassing) errors.intermediateYearOfPassing = 'Diploma Year of Passing is required.';
  }

  // 15. 10th CGPA, calculated percentage and year of passing
  const tenthCgpaNum = parseFloat(data.tenthCgpa);
  const tenthPctNum = parseFloat(data.tenthPercentage);
  if (!data.tenthCgpa || isNaN(tenthCgpaNum) || tenthCgpaNum < 0 || tenthCgpaNum > 10) errors.tenthCgpa = '10th CGPA must be between 0 and 10.';
  if (!data.tenthPercentage || isNaN(tenthPctNum) || tenthPctNum < 0 || tenthPctNum > 100) errors.tenthPercentage = '10th percentage must be between 0 and 100.';
  if (!data.tenthYearOfPassing) errors.tenthYearOfPassing = '10th Year of Passing is required.';

  // 16. CRT registration
  if (!['Registered', 'Not Registered'].includes(data.crtRegistration)) {
    errors.crtRegistration = 'Please select your CRT registration status.';
  }

  // 17. B.Tech Year of Passing (YOP)
  if (!data.btechYearOfPassing) errors.btechYearOfPassing = 'Please select your B.Tech Year of Passing.';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
