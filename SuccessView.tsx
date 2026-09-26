import React from 'react';

interface SuccessViewProps {
  student: {
    name: string;
    rollNumber: string;
    email: string;
    submissionId: string;
  };
  onDone: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ student, onDone }) => {
  return (
    <div className="max-w-xl mx-auto my-8 px-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
        {/* Top Google Forms-style blue bar */}
        <div className="h-2.5 bg-emerald-600 w-full" />

        <div className="p-8 text-center">
          {/* Logo and Green Check */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <img
              src="/avn-logo.png"
              alt="AVN Crest Logo"
              className="w-14 h-14 object-contain rounded-md shadow-xs border border-gray-100 bg-white p-0.5"
              referrerPolicy="no-referrer"
            />
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Registration Successful
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your student details have been submitted successfully.
          </p>

          {/* Submission Details Card */}
          <div className="mt-6 text-left bg-gray-50 border border-gray-200 rounded-lg p-5 space-y-3.5 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/80">
              <span className="text-gray-500 font-medium">Name:</span>
              <span className="text-gray-900 font-semibold">{student.name}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/80">
              <span className="text-gray-500 font-medium">Roll Number:</span>
              <span className="text-gray-900 font-mono font-semibold">{student.rollNumber}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-gray-200/80">
              <span className="text-gray-500 font-medium">Email:</span>
              <span className="text-gray-900 font-medium">{student.email}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between py-1">
              <span className="text-gray-500 font-medium">Submission ID:</span>
              <span className="text-gray-700 font-mono text-xs break-all">{student.submissionId}</span>
            </div>
          </div>

          {/* Done Button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={onDone}
              className="w-full sm:w-44 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
