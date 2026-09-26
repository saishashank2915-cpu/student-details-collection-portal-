# Student Details Collection Portal

A clean, fast, and secure Google Forms-style student details collection portal. Built for colleges and universities to collect student academic and personal information with real-time email OTP verification, bidirectional CGPA-to-Percentage conversion, and database duplicate checks.

---

## Features

- **Google Forms Aesthetic**: Clean single-page layout with clear section cards, minimal blue accent, and responsive spacing.
- **Personal Details**: Full name, uppercase roll number / hall ticket number, date picker with future date validation, and gender selection.
- **Email OTP Verification**:
  - Cryptographically secure 6-digit one-time password generated server-side.
  - Delivered via **Resend** transactional email API.
  - Securely hashed with SHA-256 + salt before storage (never stored in plaintext).
  - 5-minute expiration, 5 max attempts limit, and 60-second resend cooldown.
  - Server-verified single-use cryptographic submission token (no client-side spoofing).
- **Mobile Number Validation**:
  - Indian 10-digit mobile number format (+91 prefix).
  - **Strictly No Mobile OTP/SMS** (as per institution policy).
- **Academic Details**:
  - College/Institution pre-filled and editable.
  - Branch selection with conditional custom branch input.
  - Year of Study selection (1st to 4th Year).
  - **Automatic Bidirectional CGPA ↔ Percentage Conversion**:
    - Formula: `Percentage = (CGPA - 0.75) * 10`
    - Reverse: `CGPA = (Percentage / 10) + 0.75`
    - Automatic calculation while typing with helper indicators.
    - Mismatch prevention if both fields are edited manually.
  - Active backlogs non-negative integer input.
- **Department-Wise Faculty Portal & Excel Export**:
  - Department-specific faculty authentication (CSE, ECE, EEE, MECH, CIVIL, IT, AI & ML, AI & DS, Dean/Admin).
  - Faculty can view only their department's registered students (or all branches for Admin).
  - Real-time search by Roll Number, Full Name, Email, or Mobile.
  - Filter by Academic Year (1st Year to 4th Year).
  - **1-Click Export to Excel (.xlsx)**: Downloads a formatted spreadsheet with serial numbers, roll numbers, full student profiles, CGPA, backlogs, and submission timestamps.
- **Official AVN College Branding Banner**:
  - Header banner reflecting AVN Institute of Engineering & Technology branding.
  - Golden crest emblem with institutional motto ("WISDOM • VIRTUE • SERVICE • ESTD 2009").
  - Accredited by NAAC & NBA official badges.
- **Database & Duplicate Protection**:
  - Supabase PostgreSQL schema with unique roll number constraints.
  - Dual-mode architecture: connects to Supabase PostgreSQL when `DATABASE_URL` is set, or utilizes in-memory fallback for local sandboxes.
- **Vercel & Full-Stack Ready**:
  - Node.js Express server with Vite middleware for dev.
  - Vercel Serverless Functions in `/api` for zero-config Vercel deployment.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript (tsx)
- **Database**: Supabase PostgreSQL (`pg` driver)
- **Email Delivery**: Resend API
- **Deployment**: Vercel / Node.js / Docker

---

## Environment Variables

Create a `.env` or `.env.local` file in the root directory:

```env
# Resend API Key for sending OTP verification emails
RESEND_API_KEY=re_your_api_key_here

# Verified Sender Email in Resend (default: onboarding@resend.dev for testing)
RESEND_FROM_EMAIL=Student Portal <onboarding@resend.dev>

# Supabase PostgreSQL Database Connection URL
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

> **Security Note**: Never commit `.env` or `.env.local` to Git. Real credentials should only be set in your secure deployment environment (Vercel Project Settings or Cloud Run).

---

## Setup Guide

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account ([supabase.com](https://supabase.com))
- A Resend account ([resend.com](https://resend.com))

### 2. Local Installation

```bash
# Clone the repository
git clone <repo-url>
cd student-details-portal

# Install all dependencies
npm install
```

### 3. Supabase Database Setup

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy the contents of `database/schema.sql` and run the script:
   - Creates the `students` table with unique constraint on `roll_number`.
   - Creates the `email_otp_verifications` table with indexes.
4. Go to **Project Settings** → **Database** → **Connection String** → **URI**.
5. Copy the connection string and paste it into `DATABASE_URL` in your `.env` file.

### 4. Resend Setup

1. Log in to [Resend](https://resend.com).
2. Navigate to **API Keys** and generate a new key with sending permissions.
3. If using a custom domain, verify your domain under **Domains** and set `RESEND_FROM_EMAIL` (e.g. `admissions@yourcollege.edu`).
4. For quick development testing, you can use `onboarding@resend.dev`.

### 5. Running Locally

```bash
# Start development server
npm run dev
```

The application will run on `http://localhost:3000`.

### 6. Production Build

```bash
# Type check and build client assets
npm run build

# Start production server
npm run start
```

---

## Vercel Deployment

This project is structured for 1-click Vercel deployment:

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Import Project**.
3. In the project settings, configure the **Environment Variables**:
   - `RESEND_API_KEY`: Your Resend API key
   - `RESEND_FROM_EMAIL`: Sender address
   - `DATABASE_URL`: Your Supabase connection string
4. Click **Deploy**.
5. Vercel automatically deploys the frontend and the serverless functions in `/api`.

---

## Troubleshooting

- **OTP not arriving**: Check your Resend logs at `resend.com/emails`. Ensure `RESEND_API_KEY` is set correctly and the sender email is verified.
- **Roll number duplicate error**: Each roll number must be unique in the database. Enter a new roll number or check the database.
- **CGPA and Percentage mismatch**: Use the automatic calculation or ensure entered numbers follow `Percentage = (CGPA - 0.75) * 10`.
- **Database connection error**: Verify that your `DATABASE_URL` has SSL enabled (`sslmode=require`) and your database password is correctly encoded.
