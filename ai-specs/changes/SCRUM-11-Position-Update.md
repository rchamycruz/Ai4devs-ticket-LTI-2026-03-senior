  [enhanced]

  As a recruiter,
  I want to add new candidates to the ATS system,
  So that I can manage their data and track their selection process efficiently.

  ---
  Functional Scope

  This ticket covers the full vertical slice of the "Add Candidate" feature: backend endpoint, file
  upload, frontend form, validation, and E2E tests.

  ---
  Data Model

  The Candidate entity and its related models are already defined in backend/prisma/schema.prisma.
  The fields involved are:

  Candidate

  ┌───────────┬─────────┬──────────┬─────────────────────────────────┐
  │   Field   │  Type   │ Required │           Constraints           │
  ├───────────┼─────────┼──────────┼─────────────────────────────────┤
  │ firstName │ String  │ Yes      │ 2–100 chars, letters only       │
  ├───────────┼─────────┼──────────┼─────────────────────────────────┤
  │ lastName  │ String  │ Yes      │ 2–100 chars, letters only       │
  ├───────────┼─────────┼──────────┼─────────────────────────────────┤
  │ email     │ String  │ Yes      │ unique, valid email format      │
  ├───────────┼─────────┼──────────┼─────────────────────────────────┤
  │ phone     │ String? │ No       │ Spanish format: (6|7|9)XXXXXXXX │
  ├───────────┼─────────┼──────────┼─────────────────────────────────┤
  │ address   │ String? │ No       │ max 100 chars                   │
  └───────────┴─────────┴──────────┴─────────────────────────────────┘

  Education (max 3 per candidate)

  ┌─────────────┬───────────┬───────────────┐
  │    Field    │   Type    │   Required    │
  ├─────────────┼───────────┼───────────────┤
  │ institution │ String    │ Yes (max 100) │
  ├─────────────┼───────────┼───────────────┤
  │ title       │ String    │ Yes (max 250) │
  ├─────────────┼───────────┼───────────────┤
  │ startDate   │ DateTime  │ Yes           │
  ├─────────────┼───────────┼───────────────┤
  │ endDate     │ DateTime? │ No            │
  └─────────────┴───────────┴───────────────┘

  WorkExperience

  ┌─────────────┬───────────┬───────────────┐
  │    Field    │   Type    │   Required    │
  ├─────────────┼───────────┼───────────────┤
  │ company     │ String    │ Yes (max 100) │
  ├─────────────┼───────────┼───────────────┤
  │ position    │ String    │ Yes (max 100) │
  ├─────────────┼───────────┼───────────────┤
  │ description │ String?   │ No (max 200)  │
  ├─────────────┼───────────┼───────────────┤
  │ startDate   │ DateTime  │ Yes           │
  ├─────────────┼───────────┼───────────────┤
  │ endDate     │ DateTime? │ No            │
  └─────────────┴───────────┴───────────────┘

  Resume

  ┌───────────┬─────────┬──────────────────────────────────────────────────────────────────────┐
  │   Field   │  Type   │                             Constraints                              │
  ├───────────┼─────────┼──────────────────────────────────────────────────────────────────────┤
  │ filePath  │ String  │ Set by upload endpoint                                               │
  ├───────────┼─────────┼──────────────────────────────────────────────────────────────────────┤
  │ fileType  │ String  │ application/pdf or application/vnd.openxmlformats-officedocument.wor │
  │           │         │ dprocessingml.document                                               │
  ├───────────┼─────────┼──────────────────────────────────────────────────────────────────────┤
  │ uploadDat │ DateTim │ Auto-set                                                             │
  │ e         │ e       │                                                                      │
  └───────────┴─────────┴──────────────────────────────────────────────────────────────────────┘

  ---
  API Endpoints

  1. Upload CV (must be called first)

  POST /upload
  Content-Type: multipart/form-data

  Body: { file: <binary> }   # PDF or DOCX, max 10MB

  Response 200:
  {
    "filePath": "uploads/cv_filename.pdf",
    "fileType": "application/pdf"
  }

  Errors:
    400 – Invalid file type or size exceeded
    500 – Upload error

  2. Create Candidate

  POST /candidates
  Content-Type: application/json

  Body:
  {
    "firstName": "string",          // required
    "lastName": "string",           // required
    "email": "string",              // required, unique
    "phone": "string | null",
    "address": "string | null",
    "educations": [
      {
        "institution": "string",
        "title": "string",
        "startDate": "ISO8601",
        "endDate": "ISO8601 | null"
      }
    ],
    "workExperiences": [
      {
        "company": "string",
        "position": "string",
        "description": "string | null",
        "startDate": "ISO8601",
        "endDate": "ISO8601 | null"
      }
    ],
    "cv": {
      "filePath": "string",         // from /upload response
      "fileType": "string"
    }
  }

  Response 201:
  {
    "id": 1,
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string | null",
    "address": "string | null"
  }

  Errors:
    400 – Validation error or email already exists
    500 – Internal server error

  ---
  Files to Create/Modify

  Backend (backend/src/)

  Following the DDD layered architecture defined in ai-specs/specs/backend-standards.mdc:

  backend/src/
  ├── domain/
  │   └── models/
  │       ├── Candidate.ts          # CREATE – Candidate entity with validation logic
  │       ├── Education.ts          # CREATE – Education value object
  │       ├── WorkExperience.ts     # CREATE – WorkExperience value object
  │       └── Resume.ts             # CREATE – Resume value object
  ├── application/
  │   ├── services/
  │   │   └── candidateService.ts   # CREATE – addCandidate() orchestration
  │   └── validator.ts              # CREATE – Input validation rules
  ├── presentation/
  │   └── controllers/
  │       └── candidateController.ts  # CREATE – POST /candidates handler
  ├── infrastructure/
  │   └── fileUpload.ts             # CREATE – Multer config (PDF/DOCX, 10MB limit)
  ├── routes/
  │   └── candidateRoutes.ts        # CREATE – Route definitions
  └── index.ts                      # MODIFY – Register candidateRoutes and fileUpload middleware

  Frontend (frontend/src/)

  frontend/src/
  ├── components/
  │   └── AddCandidateForm.tsx      # CREATE – Controlled form component (TypeScript)
  ├── services/
  │   └── candidateService.ts       # CREATE – candidateService.addCandidate(), uploadCV()
  └── App.js                        # MODIFY – Add "Add Candidate" button/route on dashboard

  Tests

  backend/src/
  ├── domain/models/__tests__/
  │   └── Candidate.test.ts         # CREATE – Unit tests for entity validation
  ├── application/services/__tests__/
  │   └── candidateService.test.ts  # CREATE – Unit tests for service (mock Prisma)
  └── presentation/controllers/__tests__/
      └── candidateController.test.ts  # CREATE – Integration tests

  frontend/cypress/e2e/
  └── candidates.cy.ts              # CREATE – E2E: form submit, validation, error states

  ---
  Validation Rules (Backend)

  Implement in backend/src/application/validator.ts:

  // firstName / lastName: required, 2–100 chars, /^[a-zA-ZÀ-ÿ\s'-]+$/
  // email: required, RFC 5322 format, unique in DB
  // phone (if present): /^[679]\d{8}$/  (Spanish format)
  // address (if present): max 100 chars
  // educations: array max length 3; each requires institution, title, startDate
  // workExperiences: each requires company, position, startDate
  // cv (if present): filePath + fileType required together

  ---
  Frontend Form Specification (AddCandidateForm.tsx)

  - Built with React Bootstrap (Form, Button, Alert)
  - Controlled components with useState for all fields
  - Dynamic sections with Add / Remove buttons for educations (max 3) and workExperiences
  - File input triggers POST /upload on change → stores filePath + fileType in state
  - Submit: POST /candidates with assembled payload
  - On success: show Alert variant="success" + clear form
  - On error: show Alert variant="danger" with server message
  - Submit button disabled while isSubmitting === true
  - data-testid attributes on all interactive elements for Cypress

  ---
  Acceptance Criteria (Technical)

  - POST /candidates returns 201 with candidate data on valid input
  - POST /candidates returns 400 when email already exists
  - POST /candidates returns 400 when required fields are missing
  - POST /upload rejects files > 10MB with 400
  - POST /upload rejects non-PDF/DOCX files with 400
  - Education limited to 3 records per candidate (enforced in service layer)
  - Phone validation enforces Spanish format if provided
  - Dashboard shows "Add Candidate" button linking to the form
  - Form displays success alert after creation
  - Form displays error alert on server failure
  - Jest coverage ≥ 90% on new files (branches, functions, lines, statements)
  - Cypress E2E test covers: happy path, validation errors, and duplicate email

  ---
  Non-Functional Requirements

  - Security: Sanitize all string inputs to prevent injection. File upload restricted to PDF/DOCX
  MIME types; validate at both frontend and backend. File size validated server-side regardless of
  client.
  - Performance: File upload handled as multipart/form-data via multer; do not block the event loop.
  - Accessibility: All form fields must have <Form.Label> and aria-label where applicable.
  Keyboard-navigable.
  - Compatibility: Tested on Chrome, Firefox, Safari (latest). Responsive via Bootstrap grid.