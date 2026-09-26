import React from 'react';

interface FormHeaderProps {
  systemStatus?: {
    databaseConfigured: boolean;
    databaseType: string;
    supabaseAuthConfigured: boolean;
  } | null;
  onOpenFacultyPortal?: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ onOpenFacultyPortal }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden mb-5">
      {/* Top Google Forms-style blue bar */}
      <div className="h-2.5 bg-blue-600 w-full" />
      
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {/* Institution Emblem & Name */}
          <div className="flex items-center gap-3">
            <img
              src="/avn-logo.png"
              alt="AVN Crest Logo"
              className="w-12 h-12 object-contain rounded-md shadow-xs border border-gray-100 bg-white p-0.5 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100 inline-block">
                AVN Institute of Engineering and Technology
              </span>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                UGC Autonomous &bull; NAAC 'A' Grade &bull; NBA Accredited &bull; ESTD 2009
              </p>
            </div>
          </div>

          {onOpenFacultyPortal && (
            <button
              type="button"
              onClick={onOpenFacultyPortal}
              className="text-xs font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded border border-gray-200 hover:border-blue-200 transition-colors flex items-center gap-1.5 w-fit cursor-pointer self-start sm:self-center"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Faculty Login (Dept-wise)
            </button>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
          Student Details Collection
        </h1>
        <p className="mt-2 text-sm md:text-base text-gray-600 leading-relaxed">
          Please enter your details carefully. All required fields must be completed before submission.
        </p>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs md:text-sm">
          <span className="text-red-600 font-medium">
            * Indicates required field
          </span>
          <span className="text-gray-500 font-medium">
            Academic Session 2026–2027
          </span>
        </div>
      </div>
    </div>
  );
};
