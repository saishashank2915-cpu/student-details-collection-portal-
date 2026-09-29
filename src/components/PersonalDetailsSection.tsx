import React from 'react';
import { Gender } from '../types/student';

interface PersonalDetailsProps {
  firstName: string;
  lastName: string;
  rollNumber: string;
  dateOfBirth: string;
  gender: Gender | '';
  aadharNumber: string;
  panNumber: string;
  passportNumber: string;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string | undefined>;
}

export const PersonalDetailsSection: React.FC<PersonalDetailsProps> = ({
  firstName,
  lastName,
  rollNumber,
  dateOfBirth,
  gender,
  aadharNumber,
  panNumber,
  passportNumber,
  onChange,
  errors,
}) => {
  // Today's date in YYYY-MM-DD for max DOB validation
  const todayString = new Date().toISOString().split('T')[0];

  const handleRollNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Alphanumeric only, auto-converted to uppercase, spaces removed
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    onChange('rollNumber', val.slice(0, 30));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden mb-5">
      {/* Section Header */}
      <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-bold text-gray-800 tracking-wide uppercase">
          1. Personal Details
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Name Fields (First and Last Split) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              placeholder="e.g. RAHUL"
              maxLength={50}
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none transition-colors ${
                errors.firstName
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
              Last Name / Surname <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              placeholder="e.g. SHARMA"
              maxLength={50}
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none transition-colors ${
                errors.lastName
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Field 2: Roll Number / Hall Ticket Number */}
        <div>
          <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
            Roll Number / Hall Ticket Number <span className="text-red-500">*</span>
          </label>
          <input
            id="rollNumber"
            type="text"
            value={rollNumber}
            onChange={handleRollNumberChange}
            placeholder="e.g. 21B91A0501"
            maxLength={30}
            className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 font-mono tracking-wider bg-white placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none transition-colors ${
              errors.rollNumber
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
            }`}
          />
          {errors.rollNumber ? (
            <p className="mt-1 text-xs text-red-600 font-sans tracking-normal">{errors.rollNumber}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-400">Letters are automatically converted to uppercase.</p>
          )}
        </div>

        {/* Field 3: Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1.5">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            id="dateOfBirth"
            type="date"
            max={todayString}
            value={dateOfBirth}
            onChange={(e) => onChange('dateOfBirth', e.target.value)}
            className={`w-full sm:w-64 px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white focus:outline-none transition-colors ${
              errors.dateOfBirth
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                : 'border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Field 4: Gender */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">
            Gender <span className="text-red-500">*</span>
          </span>
          <div className="flex flex-wrap items-center gap-6 pt-1">
            {(['Male', 'Female', 'Other'] as Gender[]).map((option) => (
              <label
                key={option}
                className="inline-flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none"
              >
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={gender === option}
                  onChange={(e) => onChange('gender', e.target.value as Gender)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <p className="mt-1.5 text-xs text-red-600">{errors.gender}</p>
          )}
        </div>

        {/* Identity Documents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
              Aadhaar Number <span className="text-red-500">*</span>
            </label>
            <input id="aadharNumber" type="text" inputMode="numeric" maxLength={12} value={aadharNumber}
              onChange={(e) => onChange('aadharNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
              placeholder="12-digit Aadhaar number"
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white focus:outline-none ${errors.aadharNumber ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`} />
            {errors.aadharNumber && <p className="mt-1 text-xs text-red-600">{errors.aadharNumber}</p>}
          </div>
          <div>
            <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700 mb-1.5">PAN Number <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
            <input id="panNumber" type="text" maxLength={10} value={panNumber}
              onChange={(e) => onChange('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
              placeholder="e.g. ABCDE1234F"
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white focus:outline-none ${errors.panNumber ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`} />
            {errors.panNumber && <p className="mt-1 text-xs text-red-600">{errors.panNumber}</p>}
          </div>
          <div>
            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700 mb-1.5">Passport Number <span className="text-xs text-gray-400 font-normal">(Optional)</span></label>
            <input id="passportNumber" type="text" maxLength={9} value={passportNumber}
              onChange={(e) => onChange('passportNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9))}
              placeholder="Passport number"
              className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-gray-900 bg-white focus:outline-none ${errors.passportNumber ? 'border-red-400' : 'border-gray-300 focus:border-blue-600'}`} />
            {errors.passportNumber && <p className="mt-1 text-xs text-red-600">{errors.passportNumber}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
