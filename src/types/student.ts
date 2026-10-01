export type Gender = 'Male' | 'Female' | 'Other';

export type Branch =
  | 'Computer Science & Engineering (CSE)'
  | 'CSE – Artificial Intelligence & Machine Learning (AI & ML)'
  | 'CSE – Data Science (DS)'
  | 'CSE – Cyber Security (CS)'
  | 'Artificial Intelligence & Data Science (AI & DS)'
  | 'Electronics & Communication Engineering (ECE)'
  | 'Civil Engineering (CE)'
  | 'Mechanical Engineering (ME)'
  | 'Other'
  | 'CSE'
  | 'ECE'
  | 'EEE'
  | 'MECH'
  | 'CIVIL'
  | 'IT'
  | 'AI & ML'
  | 'AI & DS';

export interface StudentFormData {
  // Personal Details
  firstName: string;
  lastName: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: Gender | '';

  // Contact Details
  email: string;
  mobileNumber: string;
  aadharNumber: string;
  panNumber: string;
  passportNumber: string;
  crtRegistration: 'Registered' | 'Not Registered' | '';

  // Academic Details
  college: string;
  branch: Branch | '';
  otherBranch: string;
  cgpa: string;
  percentage: string;
  activeBacklogs: number;

  // Education Details
  intermediateOrDiploma: 'Intermediate' | 'Diploma' | '';
  intermediateCgpa: string;
  intermediatePercentage: string;
  diplomaCgpa: string;
  diplomaPercentage: string;
  intermediateYearOfPassing: string;
  btechYearOfPassing: string;
  tenthCgpa: string;
  tenthPercentage: string;
  tenthYearOfPassing: string;

  // Professional & Coding Profiles (Optional)
  linkedinLink?: string;
  resumeLink?: string;
  githubLink?: string;
  hackerrankLink?: string;
  leetcodeLink?: string;
  codechefLink?: string;
  codeforcesLink?: string;
}

export interface StudentRecord {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  date_of_birth: string;
  gender: string;
  email: string;
  email_verified: boolean;
  mobile_number: string;
  aadhar_number: string;
  pan_number?: string | null;
  passport_number?: string | null;
  crt_registration: string;
  college: string;
  branch: string;
  other_branch?: string | null;
  cgpa: number;
  percentage: number;
  active_backlogs: number;
  intermediate_or_diploma?: string | null;
  intermediate_cgpa?: number | null;
  intermediate_percentage?: number | null;
  diploma_cgpa?: number | null;
  diploma_percentage?: number | null;
  intermediate_year_of_passing?: string | null;
  btech_year_of_passing?: string | null;
  tenth_cgpa?: number | null;
  tenth_percentage?: number | null;
  tenth_year_of_passing?: string | null;
  
  // Professional & Coding Profiles (Optional)
  linkedin_link?: string | null;
  resume_link?: string | null;
  github_link?: string | null;
  hackerrank_link?: string | null;
  leetcode_link?: string | null;
  codechef_link?: string | null;
  codeforces_link?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface OtpSendResponse {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  verified?: boolean;
  verificationToken?: string;
  remainingAttempts?: number;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  student?: {
    name: string; // Kept as combined name for the success screen display
    rollNumber: string;
    email: string;
    submissionId: string;
  };
  errors?: Record<string, string>;
}
