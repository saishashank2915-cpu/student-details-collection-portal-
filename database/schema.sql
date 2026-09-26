-- Supabase PostgreSQL Schema for Student Details Collection Portal

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  roll_number VARCHAR(30) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT TRUE NOT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  aadhar_number VARCHAR(12) NOT NULL,
  pan_number VARCHAR(10),
  passport_number VARCHAR(9),
  college VARCHAR(255) NOT NULL,
  branch VARCHAR(50) NOT NULL,
  other_branch VARCHAR(100),
  cgpa NUMERIC(4, 2) NOT NULL,
  percentage NUMERIC(5, 2) NOT NULL,
  active_backlogs INTEGER NOT NULL DEFAULT 0,
  intermediate_or_diploma VARCHAR(30),
  intermediate_cgpa NUMERIC(4, 2),
  intermediate_percentage NUMERIC(5, 2),
  diploma_cgpa NUMERIC(4, 2),
  diploma_percentage NUMERIC(5, 2),
  intermediate_year_of_passing VARCHAR(10),
  btech_year_of_passing VARCHAR(10),
  tenth_cgpa NUMERIC(4, 2),
  tenth_percentage NUMERIC(5, 2),
  tenth_year_of_passing VARCHAR(10),
  crt_registration VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups and unique constraint enforcement
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- 2. Email OTP Verifications Table
CREATE TABLE IF NOT EXISTS email_otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255),
  token_expires_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER DEFAULT 0 NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for OTP queries
CREATE INDEX IF NOT EXISTS idx_email_otp_email ON email_otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_otp_token ON email_otp_verifications(verification_token);
