# Student registry fixes

This review branch fixes department filtering (including historical truncated AI&ML names), preserves full department names on new submissions, uses the same signed session for list/export/update/delete, and enforces department authorization on record mutations.

Faculty edits send only changed fields. Names are uppercased when edited, empty surnames and single-letter given names are accepted, and CGPA changes recompute stored percentages. Unrelated legacy missing fields do not block name-only corrections. Changes to an email clear its verification status. Identity/contact formats, marks, education chronology, years and optional profile URLs are validated. Profiles now persist on submission and can be edited and exported. The faculty table uses 50-row pages; totals and exports retain the full filtered result. Full-name search, year filters, duplicate banners and canonical education-year field names are fixed.

The development server delegates to the production API handlers to prevent divergent behavior. TypeScript roots include active entrypoints and their imported dependencies rather than unused duplicate files at the repository root.

## Before deployment

Set a new, strong `FACULTY_JWT_SECRET` and separate `FACULTY_PASSWORD_<DEPARTMENT>` values in the private deployment environment. See `.env.example` for names. Missing department passwords disable those logins; there is no global password granting admin access. Old hardcoded passwords and signing secrets appeared in the public repository and must not be reused. Existing sessions become invalid when the signing secret changes. No real credentials belong in Git.

Use a separate preview database and private preview credentials for testing. The schema initialization widens `students.branch` to TEXT; it does not rewrite existing department names or student records. Test the PostgreSQL migration on a database copy before production. Historical unused source copies remain in the repository and are not deployment entrypoints.

## Verification

Run `npm ci`, `npm run lint`, `npm test`, and `npm run build`.

The regression tests use synthetic records in memory, never production. They cover name-only preservation, optional surnames, numeric validation, CGPA calculations, chronology, profile URLs, session tampering, credential isolation, scoped list/export including legacy AI&ML names, export contents, and cross-department update/delete denial.

Browser acceptance: confirm login with private preview credentials; AI&ML filter includes legacy and complete names; change a fixture's CGPA from 7.31 to 8 and reload to confirm 75%; save a name-only fixture with empty surname and compare unrelated fields; download Excel and check education/profile columns and row count; verify year filters, pagination, mobile layout, and new submission with email verification. Do not create or delete production student records for testing.

Production deployment and database-backed acceptance testing are separate from the local build and in-memory regression tests.
