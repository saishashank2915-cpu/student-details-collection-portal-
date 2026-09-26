import React, { useState, useEffect } from 'react';
import { CollegeBanner } from './components/CollegeBanner';
import { FormHeader } from './components/FormHeader';
import { PersonalDetailsSection } from './components/PersonalDetailsSection';
import { ContactVerificationSection } from './components/ContactVerificationSection';
import { AcademicDetailsSection } from './components/AcademicDetailsSection';
import { SuccessView } from './components/SuccessView';
import { FacultyPortal } from './components/FacultyPortal';
import { StudentFormData, SubmitResponse } from './types/student';
import { validateStudentForm, ValidationErrors } from './lib/validation';

const INITIAL_FORM_DATA: StudentFormData = {
  fullName: '',
  rollNumber: '',
  dateOfBirth: '',
  gender: '',
  email: '',
  mobileNumber: '',
  aadharNumber: '',
  panNumber: '',
  passportNumber: '',
  crtRegistration: '',
  college: 'AVN INSTITUTE OF ENGINEERING AND TECHNOLOGY',
  branch: '',
  otherBranch: '',
  cgpa: '',
  percentage: '',
  activeBacklogs: 0,
  intermediateOrDiploma: '',
  intermediateCgpa: '',
  intermediatePercentage: '',
  diplomaCgpa: '',
  diplomaPercentage: '',
  intermediateYearOfPassing: '',
  btechYearOfPassing: '',
  tenthCgpa: '',
  tenthPercentage: '',
  tenthYearOfPassing: '',
};

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'faculty'>('student');
  const [formData, setFormData] = useState<StudentFormData>(INITIAL_FORM_DATA);
  const [verificationToken, setVerificationToken] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedStudent, setSubmittedStudent] = useState<{
    name: string;
    rollNumber: string;
    email: string;
    submissionId: string;
  } | null>(null);

  const [systemStatus, setSystemStatus] = useState<{
    databaseConfigured: boolean;
    databaseType: string;
    supabaseAuthConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch(() => {});
  }, []);

  const handleFieldChange = (field: string, value: any) => {
    if (field === 'intermediateOrDiploma') {
      setFormData((prev) => ({
        ...prev,
        intermediateOrDiploma: value,
        intermediateCgpa: value === 'Intermediate' ? prev.intermediateCgpa : '',
        intermediatePercentage: value === 'Intermediate' ? prev.intermediatePercentage : '',
        diplomaCgpa: value === 'Diploma' ? prev.diplomaCgpa : '',
        diplomaPercentage: value === 'Diploma' ? prev.diplomaPercentage : '',
        intermediateYearOfPassing: prev.intermediateYearOfPassing,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.intermediateOrDiploma;
        delete next.intermediateCgpa;
        delete next.intermediatePercentage;
        delete next.diplomaCgpa;
        delete next.diplomaPercentage;
        delete next.intermediateYearOfPassing;
        return next;
      });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear field-specific error as user types
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as keyof ValidationErrors];
        return next;
      });
    }
  };

  const handleEmailChange = (newEmail: string) => {
    handleFieldChange('email', newEmail);
    if (isEmailVerified) {
      setIsEmailVerified(false);
      setVerificationToken('');
    }
  };

  const handleVerificationSuccess = (token: string) => {
    setVerificationToken(token);
    setIsEmailVerified(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  const handleResetEmailVerification = () => {
    setIsEmailVerified(false);
    setVerificationToken('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // 1. Client-side validation
    const { isValid, errors: validationErrors } = validateStudentForm(formData, isEmailVerified);
    if (!isValid) {
      setErrors(validationErrors);

      // Scroll to the first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      return;
    }

    // 2. Submit to backend
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/students/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          rollNumber: formData.rollNumber,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          email: formData.email,
          verificationToken,
          mobileNumber: formData.mobileNumber,
          aadharNumber: formData.aadharNumber,
          panNumber: formData.panNumber || null,
          passportNumber: formData.passportNumber || null,
          crtRegistration: formData.crtRegistration,
          college: formData.college,
          branch: formData.branch,
          otherBranch: formData.branch === 'Other' ? formData.otherBranch : undefined,
          cgpa: parseFloat(formData.cgpa),
          percentage: parseFloat(formData.percentage),
          activeBacklogs: Number(formData.activeBacklogs),
          intermediateOrDiploma: formData.intermediateOrDiploma,
          intermediateCgpa: formData.intermediateOrDiploma === 'Intermediate' ? parseFloat(formData.intermediateCgpa) : null,
          intermediatePercentage: formData.intermediateOrDiploma === 'Intermediate' ? parseFloat(formData.intermediatePercentage) : null,
          diplomaCgpa: formData.intermediateOrDiploma === 'Diploma' ? parseFloat(formData.diplomaCgpa) : null,
          diplomaPercentage: formData.intermediateOrDiploma === 'Diploma' ? parseFloat(formData.diplomaPercentage) : null,
          intermediateYearOfPassing: formData.intermediateYearOfPassing || null,
          btechYearOfPassing: formData.btechYearOfPassing,
          tenthCgpa: parseFloat(formData.tenthCgpa),
          tenthPercentage: parseFloat(formData.tenthPercentage),
          tenthYearOfPassing: formData.tenthYearOfPassing || null,
        }),
      });

      const data: SubmitResponse = await response.json();

      if (response.ok && data.success && data.student) {
        setSubmittedStudent(data.student);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        if (data.errors) {
          setErrors(data.errors);
          const firstKey = Object.keys(data.errors)[0];
          const el = document.getElementById(firstKey);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        setGeneralError(data.message || 'Submission failed. Please check your entries.');
      }
    } catch (err: any) {
      setGeneralError('Network error while submitting details. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setFormData(INITIAL_FORM_DATA);
    setIsEmailVerified(false);
    setVerificationToken('');
    setErrors({});
    setGeneralError(null);
    setSubmittedStudent(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If faculty portal view is active
  if (currentView === 'faculty') {
    return (
      <div className="min-h-screen bg-[#f0f4f8] py-6 sm:py-10 px-3 sm:px-4">
        <main className="max-w-6xl mx-auto">
          <CollegeBanner />
          <FacultyPortal onBackToStudentForm={() => setCurrentView('student')} />
        </main>
      </div>
    );
  }

  // If already submitted successfully, render Google Forms-style Success Screen
  if (submittedStudent) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] py-8 sm:py-12 px-3 sm:px-4">
        <div className="max-w-[760px] mx-auto">
          <CollegeBanner />
          <SuccessView student={submittedStudent} onDone={handleDone} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] py-6 sm:py-10 px-3 sm:px-4">
      <main className="max-w-[760px] mx-auto">
        {/* College Branding Banner */}
        <CollegeBanner />

        {/* Form Header */}
        <FormHeader
          systemStatus={systemStatus}
          onOpenFacultyPortal={() => setCurrentView('faculty')}
        />

        {/* Global submission error alert */}
        {generalError && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold">Unable to submit form</p>
              <p className="mt-0.5">{generalError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Personal Details */}
          <PersonalDetailsSection
            fullName={formData.fullName}
            rollNumber={formData.rollNumber}
            dateOfBirth={formData.dateOfBirth}
            gender={formData.gender}
            aadharNumber={formData.aadharNumber}
            panNumber={formData.panNumber}
            passportNumber={formData.passportNumber}
            onChange={handleFieldChange}
            errors={errors}
          />

          {/* Section 2: Contact Verification */}
          <ContactVerificationSection
            email={formData.email}
            mobileNumber={formData.mobileNumber}
            isEmailVerified={isEmailVerified}
            verificationToken={verificationToken}
            onEmailChange={handleEmailChange}
            onMobileChange={(mobile) => handleFieldChange('mobileNumber', mobile)}
            onVerificationSuccess={handleVerificationSuccess}
            onResetEmailVerification={handleResetEmailVerification}
            errors={errors}
          />

          {/* Section 3: Academic & Education Details */}
          <AcademicDetailsSection
            college={formData.college}
            branch={formData.branch}
            otherBranch={formData.otherBranch}
            cgpa={formData.cgpa}
            percentage={formData.percentage}
            activeBacklogs={formData.activeBacklogs}
            intermediateOrDiploma={formData.intermediateOrDiploma}
            intermediateCgpa={formData.intermediateCgpa}
            intermediatePercentage={formData.intermediatePercentage}
            diplomaCgpa={formData.diplomaCgpa}
            diplomaPercentage={formData.diplomaPercentage}
            intermediateYearOfPassing={formData.intermediateYearOfPassing}
            btechYearOfPassing={formData.btechYearOfPassing}
            tenthCgpa={formData.tenthCgpa}
            tenthPercentage={formData.tenthPercentage}
            tenthYearOfPassing={formData.tenthYearOfPassing}
            crtRegistration={formData.crtRegistration}
            onChange={handleFieldChange}
            errors={errors}
          />

          {/* Bottom Action Area */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 mb-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3 rounded-md text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Student Details'
              )}
            </button>

            <span className="text-xs text-gray-500 text-center sm:text-right">
              All required fields (*) must be completed before submission.
            </span>
          </div>

          {/* Faculty Portal Link Footer */}
          <div className="pt-6 pb-12 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <span>&copy; {new Date().getFullYear()} AVN Institute of Engineering and Technology</span>
            <button
              type="button"
              onClick={() => setCurrentView('faculty')}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Faculty / Department Login &bull; Excel Export
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
