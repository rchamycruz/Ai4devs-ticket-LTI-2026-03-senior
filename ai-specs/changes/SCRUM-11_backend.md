# Backend Implementation Plan: SCRUM-11 — Add Candidate to the System

## Overview

This plan covers the full backend implementation for adding a candidate to the ATS system. The feature involves creating a `POST /candidates` endpoint and a `POST /upload` endpoint for CV file upload. The backend is currently a skeleton (`src/index.ts` has no routes or middleware). All layers — Domain, Application, Presentation, and Infrastructure — must be created from scratch following the project's DDD layered architecture.

**Key constraint**: `prisma/schema.prisma` currently only contains a `User` model. All candidate-related Prisma models must be added and migrated.

---

## Architecture Context

### Layers involved
| Layer | Responsibility |
|---|---|
| **Domain** | `Candidate` aggregate root + `Education`, `WorkExperience`, `Resume` entities with `save()` and `findOne()` methods |
| **Application** | `candidateService.ts` — orchestrates validation + persistence; `validator.ts` — validates input |
| **Infrastructure** | `fileUpload.ts` — multer configuration; `prismaClient.ts` — singleton Prisma client |
| **Presentation** | `candidateController.ts` — thin HTTP handlers; `candidateRoutes.ts` — route definitions |

### Components / files referenced
- `backend/prisma/schema.prisma` — **MODIFY** (add all candidate models)
- `backend/src/index.ts` — **MODIFY** (register middleware and routes)
- `backend/src/domain/models/Candidate.ts` — **CREATE**
- `backend/src/domain/models/Education.ts` — **CREATE**
- `backend/src/domain/models/WorkExperience.ts` — **CREATE**
- `backend/src/domain/models/Resume.ts` — **CREATE**
- `backend/src/application/validator.ts` — **CREATE**
- `backend/src/application/services/candidateService.ts` — **CREATE**
- `backend/src/infrastructure/fileUpload.ts` — **CREATE**
- `backend/src/infrastructure/prismaClient.ts` — **CREATE**
- `backend/src/presentation/controllers/candidateController.ts` — **CREATE**
- `backend/src/routes/candidateRoutes.ts` — **CREATE**
- `backend/src/domain/models/__tests__/Candidate.test.ts` — **CREATE**
- `backend/src/application/services/__tests__/candidateService.test.ts` — **CREATE**
- `backend/src/presentation/controllers/__tests__/candidateController.test.ts` — **CREATE**

---

## Implementation Steps

### Step 0: Create Feature Branch

- **Action**: Create and switch to a dedicated backend feature branch.
- **Branch name**: `feature/SCRUM-11-backend`
- **Implementation Steps**:
  1. Ensure you are on `main`: `git checkout main`
  2. Pull latest changes: `git pull origin main`
  3. Create the branch: `git checkout -b feature/SCRUM-11-backend`
  4. Verify: `git branch`
- **Notes**: All code changes must happen on this branch. Do NOT work on `main` or `solved-RACC`.

---

### Step 1: Install Missing Dependency — multer

- **Action**: Install `multer` and its TypeScript types (not present in `package.json`).
- **Implementation Steps**:
  1. From `backend/`: run `npm install multer`
  2. Run `npm install --save-dev @types/multer`
  3. Verify entries appear in `package.json` dependencies.
- **Notes**: `multer` is the standard Express middleware for `multipart/form-data` file uploads. It is not currently listed in `backend/package.json`.

---

### Step 2: Update Prisma Schema

- **File**: `backend/prisma/schema.prisma`
- **Action**: Replace/extend the schema to include all candidate-related models.
- **Implementation Steps**:
  1. Keep the existing `datasource` and `generator` blocks unchanged.
  2. Remove or keep the existing `User` model (do not break anything relying on it).
  3. Add the following models with their exact field names and constraints:

  **`Candidate`**
  ```prisma
  model Candidate {
    id              Int              @id @default(autoincrement())
    firstName       String           @db.VarChar(100)
    lastName        String           @db.VarChar(100)
    email           String           @unique @db.VarChar(255)
    phone           String?          @db.VarChar(15)
    address         String?          @db.VarChar(100)
    educations      Education[]
    workExperiences WorkExperience[]
    resumes         Resume[]
    applications    Application[]
  }
  ```

  **`Education`**
  ```prisma
  model Education {
    id          Int       @id @default(autoincrement())
    institution String    @db.VarChar(100)
    title       String    @db.VarChar(250)
    startDate   DateTime
    endDate     DateTime?
    candidateId Int
    candidate   Candidate @relation(fields: [candidateId], references: [id])
  }
  ```

  **`WorkExperience`**
  ```prisma
  model WorkExperience {
    id          Int       @id @default(autoincrement())
    company     String    @db.VarChar(100)
    position    String    @db.VarChar(100)
    description String?   @db.VarChar(200)
    startDate   DateTime
    endDate     DateTime?
    candidateId Int
    candidate   Candidate @relation(fields: [candidateId], references: [id])
  }
  ```

  **`Resume`**
  ```prisma
  model Resume {
    id          Int       @id @default(autoincrement())
    filePath    String    @db.VarChar(500)
    fileType    String    @db.VarChar(50)
    uploadDate  DateTime  @default(now())
    candidateId Int
    candidate   Candidate @relation(fields: [candidateId], references: [id])
  }
  ```

  **Stub models** (needed to satisfy Candidate relations; implement fully in future tickets):
  ```prisma
  model Application {
    id                  Int       @id @default(autoincrement())
    applicationDate     DateTime  @default(now())
    currentInterviewStep Int
    notes               String?
    candidateId         Int
    candidate           Candidate @relation(fields: [candidateId], references: [id])
  }
  ```

  4. Run: `npx prisma migrate dev --name add-candidate-models`
  5. Run: `npx prisma generate`
- **Notes**: Dates must be `DateTime` (not `String`) to match the data model spec. The `Application` model is a minimal stub to avoid schema errors; do not implement full application logic here.

---

### Step 3: Create Prisma Client Singleton

- **File**: `backend/src/infrastructure/prismaClient.ts`
- **Action**: Export a singleton `PrismaClient` instance for use across the application.
- **Function Signature**:
  ```typescript
  export const prisma: PrismaClient
  ```
- **Implementation Steps**:
  1. Create file `backend/src/infrastructure/prismaClient.ts`.
  2. Import `PrismaClient` from `@prisma/client`.
  3. Instantiate once and export as `prisma`.
- **Implementation Notes**: The current `index.ts` creates a local Prisma instance — replace all references to use this shared singleton after creating routes. This prevents multiple Prisma client instances in tests.

---

### Step 4: Create Domain Model — `Education`

- **File**: `backend/src/domain/models/Education.ts`
- **Action**: Create the `Education` class as a domain entity.
- **Function Signature**:
  ```typescript
  export class Education {
    id?: number;
    institution: string;
    title: string;
    startDate: Date;
    endDate?: Date;
    candidateId?: number;

    constructor(data: {
      id?: number;
      institution: string;
      title: string;
      startDate: string | Date;
      endDate?: string | Date | null;
      candidateId?: number;
    })
  }
  ```
- **Implementation Steps**:
  1. Create directory `backend/src/domain/models/` if it doesn't exist.
  2. Assign each field from `data` in the constructor.
  3. Convert `startDate` and `endDate` to `Date` objects using `new Date(...)`.
  4. Set `endDate` to `undefined` when the input is `null` or missing.
- **Implementation Notes**: No `save()` method here — Education is persisted as part of the `Candidate` aggregate via Prisma nested writes.

---

### Step 5: Create Domain Model — `WorkExperience`

- **File**: `backend/src/domain/models/WorkExperience.ts`
- **Action**: Create the `WorkExperience` class as a domain entity.
- **Function Signature**:
  ```typescript
  export class WorkExperience {
    id?: number;
    company: string;
    position: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    candidateId?: number;

    constructor(data: {
      id?: number;
      company: string;
      position: string;
      description?: string | null;
      startDate: string | Date;
      endDate?: string | Date | null;
      candidateId?: number;
    })
  }
  ```
- **Implementation Steps**:
  1. Mirror the same pattern as `Education`.
  2. Convert date strings to `Date` objects.
  3. `description` is optional — assign only if truthy.

---

### Step 6: Create Domain Model — `Resume`

- **File**: `backend/src/domain/models/Resume.ts`
- **Action**: Create the `Resume` class as a domain entity.
- **Function Signature**:
  ```typescript
  export class Resume {
    id?: number;
    filePath: string;
    fileType: string;
    uploadDate: Date;
    candidateId?: number;

    constructor(data: {
      id?: number;
      filePath: string;
      fileType: string;
      uploadDate?: Date;
      candidateId?: number;
    })
  }
  ```
- **Implementation Steps**:
  1. Assign `uploadDate` as `data.uploadDate ?? new Date()`.

---

### Step 7: Create Domain Model — `Candidate` (Aggregate Root)

- **File**: `backend/src/domain/models/Candidate.ts`
- **Action**: Create the `Candidate` class as the aggregate root, including `save()` and static `findOne()`.
- **Function Signatures**:
  ```typescript
  export class Candidate {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    educations: Education[];
    workExperiences: WorkExperience[];
    resumes: Resume[];

    constructor(data: {
      id?: number;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      educations?: any[];
      workExperiences?: any[];
      resumes?: any[];
    })

    async save(): Promise<Candidate>

    static async findOne(id: number): Promise<Candidate | null>
  }
  ```
- **Implementation Steps**:
  1. Constructor: assign scalar fields; map `educations` to `new Education(e)` array, same for `workExperiences` and `resumes`.
  2. `save()`:
     - If `this.id` is **undefined**: use `prisma.candidate.create()` with nested `create` for `educations`, `workExperiences`, and `resumes`.
     - Return `new Candidate(result)`.
  3. `static findOne(id)`:
     - Use `prisma.candidate.findUnique({ where: { id }, include: { educations: true, workExperiences: true, resumes: true } })`.
     - Return `new Candidate(data)` or `null`.
  4. Import `prisma` from `../../infrastructure/prismaClient`.
- **Implementation Notes**:
  - The `save()` method handles Prisma error `P2002` (unique email violation) — catch it and re-throw as `new Error('Email already exists')`.
  - Never call Prisma directly from the service — always go through `candidate.save()`.

---

### Step 8: Create Application Validator

- **File**: `backend/src/application/validator.ts`
- **Action**: Implement all validation rules for candidate input data.
- **Function Signature**:
  ```typescript
  export function validateCandidateData(data: any): void
  ```
- **Implementation Steps**:
  1. Create directory `backend/src/application/` if it doesn't exist.
  2. Validate `firstName` and `lastName`:
     - Required, 2–100 chars
     - Pattern: `/^[a-zA-ZÀ-ÿ\s'-]+$/` (letters, accented chars, spaces, hyphens, apostrophes)
  3. Validate `email`: required, pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  4. Validate `phone` (if present): pattern `/^[679]\d{8}$/` (Spanish format)
  5. Validate `address` (if present): max 100 chars
  6. Validate `educations` (if present):
     - Array max length: 3
     - Each item: `institution` (required, max 100), `title` (required, max 250), `startDate` (required, valid date)
     - `endDate` optional but must be valid date if present
  7. Validate `workExperiences` (if present):
     - Each item: `company` (required, max 100), `position` (required, max 100), `startDate` (required, valid date)
     - `description` optional, max 200 chars if present
  8. Validate `cv` (if present): both `filePath` and `fileType` must be present together
  9. On any failure: `throw new Error('<descriptive message>')` — the controller maps these to HTTP 400.
- **Implementation Notes**: Do NOT use external validation libraries. Use pure TypeScript regex and conditionals to keep dependencies minimal.

---

### Step 9: Create Application Service — `candidateService`

- **File**: `backend/src/application/services/candidateService.ts`
- **Action**: Implement the `addCandidate` service function that orchestrates validation and persistence.
- **Function Signature**:
  ```typescript
  export const addCandidate = async (candidateData: any): Promise<Candidate>
  ```
- **Implementation Steps**:
  1. Create directory `backend/src/application/services/` if it doesn't exist.
  2. Call `validateCandidateData(candidateData)` — throws on invalid input.
  3. Instantiate `const candidate = new Candidate(candidateData)`.
  4. Call `await candidate.save()` and return the result.
  5. Do NOT call Prisma directly in this file — delegate to the domain model.
- **Implementation Notes**: This function is intentionally thin. All business rules live in the validator and domain model.

---

### Step 10: Create Infrastructure — File Upload Middleware

- **File**: `backend/src/infrastructure/fileUpload.ts`
- **Action**: Configure `multer` for CV file upload (PDF and DOCX only, max 10MB).
- **Exports**:
  ```typescript
  export const upload: multer.Multer  // multer instance configured for disk storage
  export const UPLOAD_DIR = 'uploads'
  ```
- **Implementation Steps**:
  1. Import `multer` and `path`.
  2. Configure `diskStorage`:
     - `destination`: `uploads/` directory (create if absent using `fs.mkdirSync`)
     - `filename`: `${Date.now()}-${originalname}`
  3. Configure `fileFilter`:
     - Allow only `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - Reject others with `new Error('Invalid file type. Only PDF and DOCX are allowed.')`
  4. Set `limits: { fileSize: 10 * 1024 * 1024 }` (10MB).
  5. Export `multer({ storage, fileFilter, limits })` as `upload`.
- **Implementation Notes**: The `uploads/` directory should be added to `.gitignore`.

---

### Step 11: Create Presentation Controller

- **File**: `backend/src/presentation/controllers/candidateController.ts`
- **Action**: Create thin HTTP handlers that delegate to services.
- **Function Signatures**:
  ```typescript
  export const addCandidate = async (req: Request, res: Response): Promise<void>
  export const uploadFile = async (req: Request, res: Response): Promise<void>
  ```
- **Implementation Steps**:

  **`addCandidate`**:
  1. Extract body from `req.body`.
  2. Call `await candidateService.addCandidate(req.body)`.
  3. On success: `res.status(201).json(result)`.
  4. On error with message `'Email already exists'`: `res.status(400).json({ error: e.message })`.
  5. On validation error (thrown from validator): `res.status(400).json({ error: e.message })`.
  6. On any other error: `res.status(500).json({ error: 'Internal server error' })`.

  **`uploadFile`**:
  1. If `!req.file`: `res.status(400).json({ error: 'No file uploaded' })`.
  2. Otherwise: `res.status(200).json({ filePath: req.file.path, fileType: req.file.mimetype })`.
  3. On multer error (wrong type/size): `res.status(400).json({ error: err.message })`.

- **Implementation Notes**: Controllers must NOT contain business logic. Import `addCandidate` from `../../application/services/candidateService`. Error classification must be specific — do not use a single catch-all 500 for all errors.

---

### Step 12: Create Routes

- **File**: `backend/src/routes/candidateRoutes.ts`
- **Action**: Define RESTful routes for candidates and file upload.
- **Implementation Steps**:
  1. Create `backend/src/routes/` directory.
  2. Import `express.Router`, controllers, and `upload` middleware.
  3. Define:
     ```
     POST /candidates     → candidateController.addCandidate
     POST /upload         → upload.single('file'), candidateController.uploadFile
     ```
  4. Export the router.

---

### Step 13: Update `index.ts` — Register Routes and Middleware

- **File**: `backend/src/index.ts`
- **Action**: Add `express.json()` middleware and mount the candidate routes.
- **Implementation Steps**:
  1. Add `app.use(express.json())` before any routes.
  2. Import `candidateRoutes` from `./routes/candidateRoutes`.
  3. Mount: `app.use('/', candidateRoutes)`.
  4. Replace the local `new PrismaClient()` with the singleton from `./infrastructure/prismaClient`.
  5. Keep the existing error handler middleware at the bottom.
- **Implementation Notes**: Without `express.json()`, `req.body` will be `undefined` for all POST requests.

---

### Step 14: Write Unit Tests

#### Step 14a — Domain Model Tests

- **File**: `backend/src/domain/models/__tests__/Candidate.test.ts`
- **Action**: Unit-test the `Candidate` constructor and `save()` method.
- **Implementation Steps**:
  1. Mock `prisma` using `jest.mock('../../../infrastructure/prismaClient')`.
  2. **Constructor tests**:
     - Assigns scalar fields correctly
     - Maps `educations` array to `Education` instances
     - Maps `workExperiences` array to `WorkExperience` instances
     - Maps `resumes` array to `Resume` instances
     - Handles missing optional fields (`phone`, `address` → `undefined`)
  3. **`save()` tests**:
     - Calls `prisma.candidate.create` with correct nested structure
     - Returns a `Candidate` instance on success
     - Throws `'Email already exists'` when Prisma raises `P2002`
  4. **`findOne()` tests**:
     - Calls `prisma.candidate.findUnique` with correct `include`
     - Returns `null` when candidate not found
     - Returns `Candidate` instance when found
- **Coverage target**: ≥ 90% branches, functions, lines, statements.

#### Step 14b — Validator Tests

- **File**: `backend/src/application/__tests__/validator.test.ts`
- **Action**: Test all validation rules with valid and invalid inputs.
- **Implementation Steps**:
  1. **Successful cases**: valid complete payload, optional fields absent.
  2. **firstName/lastName**: missing, too short (<2), too long (>100), invalid chars.
  3. **email**: missing, invalid format, with spaces.
  4. **phone**: invalid format (e.g., starts with `5`), valid Spanish formats.
  5. **address**: exceeds 100 chars.
  6. **educations**: >3 items, missing `institution`, missing `startDate`, invalid date.
  7. **workExperiences**: missing `company`, missing `startDate`.
  8. **cv**: `filePath` without `fileType`, `fileType` without `filePath`.

#### Step 14c — Service Tests

- **File**: `backend/src/application/services/__tests__/candidateService.test.ts`
- **Action**: Unit-test `addCandidate` with mocked domain and validator.
- **Implementation Steps**:
  1. Mock `validateCandidateData` from `../../validator`.
  2. Mock `Candidate` class (specifically its `save()` method).
  3. **Success path**: validator passes, `save()` returns candidate, service returns it.
  4. **Validation failure**: validator throws → service re-throws.
  5. **Save failure**: `save()` throws `'Email already exists'` → service re-throws.

#### Step 14d — Controller Tests

- **File**: `backend/src/presentation/controllers/__tests__/candidateController.test.ts`
- **Action**: Integration-test HTTP handlers using `supertest`.
- **Implementation Steps**:
  1. Mock `candidateService.addCandidate`.
  2. **`POST /candidates` — success**: mock resolves → expect `201` with candidate data.
  3. **`POST /candidates` — validation error**: mock throws `'firstName is required'` → expect `400`.
  4. **`POST /candidates` — duplicate email**: mock throws `'Email already exists'` → expect `400`.
  5. **`POST /candidates` — server error**: mock throws generic error → expect `500`.
  6. **`POST /upload` — success**: upload a test PDF file → expect `200` with `filePath` and `fileType`.
  7. **`POST /upload` — invalid type**: upload a `.txt` file → expect `400`.
  8. **`POST /upload` — no file**: no file attached → expect `400`.

---

### Step 15: Update Technical Documentation

- **Action**: Update documentation to reflect all changes.
- **Implementation Steps**:
  1. **`ai-specs/specs/data-model.md`**: Verify the existing Candidate, Education, WorkExperience, Resume sections match the Prisma schema created. Add `Application` stub note.
  2. **`ai-specs/specs/api-spec.yml`**: Verify `POST /candidates` and `POST /upload` sections match the implementation. Confirm `CreateCandidateRequest` schema matches the validator rules (field names, types, constraints).
  3. No changes needed to `backend-standards.mdc` or `frontend-standards.mdc` unless a new pattern was introduced.
- **Notes**: All documentation must be in English. This step is **mandatory** before considering the implementation complete.

---

## Implementation Order

1. Step 0 — Create feature branch
2. Step 1 — Install `multer`
3. Step 2 — Update Prisma schema + run migration
4. Step 3 — Create `prismaClient.ts` singleton
5. Step 4 — Create `Education` domain model
6. Step 5 — Create `WorkExperience` domain model
7. Step 6 — Create `Resume` domain model
8. Step 7 — Create `Candidate` aggregate root (depends on Steps 4–6)
9. Step 8 — Create `validator.ts`
10. Step 9 — Create `candidateService.ts` (depends on Steps 7–8)
11. Step 10 — Create `fileUpload.ts`
12. Step 11 — Create `candidateController.ts` (depends on Steps 9–10)
13. Step 12 — Create `candidateRoutes.ts` (depends on Step 11)
14. Step 13 — Update `index.ts` (depends on Step 12)
15. Step 14 — Write all unit tests
16. Step 15 — Update documentation

---

## Testing Checklist

- [ ] `POST /candidates` returns `201` with created candidate on valid payload
- [ ] `POST /candidates` returns `400` with error message when `firstName` is missing
- [ ] `POST /candidates` returns `400` with error message when `email` format is invalid
- [ ] `POST /candidates` returns `400` when email is already registered in the DB
- [ ] `POST /candidates` returns `400` when more than 3 education records are provided
- [ ] `POST /candidates` returns `400` when phone does not match Spanish format
- [ ] `POST /candidates` returns `500` on unexpected server error
- [ ] `POST /upload` returns `200` with `filePath` and `fileType` for valid PDF
- [ ] `POST /upload` returns `200` with `filePath` and `fileType` for valid DOCX
- [ ] `POST /upload` returns `400` for `.txt` or other unsupported types
- [ ] `POST /upload` returns `400` for files exceeding 10MB
- [ ] `POST /upload` returns `400` when no file is attached
- [ ] Jest coverage ≥ 90% for all new files (branches, functions, lines, statements)
- [ ] No TypeScript compilation errors (`npm run build` passes)

---

## Error Response Format

All errors must follow this JSON structure:

```json
{
  "error": "<descriptive message in English>"
}
```

| Scenario | HTTP Status |
|---|---|
| Missing required field | `400` |
| Invalid field format | `400` |
| Email already exists | `400` |
| Invalid file type | `400` |
| File too large | `400` |
| No file uploaded | `400` |
| Unexpected server error | `500` |

---

## Dependencies

| Package | Type | Purpose | Currently installed? |
|---|---|---|---|
| `multer` | runtime | multipart/form-data file upload | **NO — must install** |
| `@types/multer` | dev | TypeScript types for multer | **NO — must install** |
| `express` | runtime | HTTP framework | Yes |
| `@prisma/client` | runtime | Database ORM | Yes |
| `prisma` | dev | Migration CLI | Yes |
| `jest` | dev | Test runner | Yes |
| `supertest` | dev | HTTP integration testing | Yes |
| `ts-jest` | dev | TypeScript in Jest | Yes |

---

## Notes

- **English only**: All variables, functions, comments, error messages, and test names must be in English (per `base-standards.mdc`).
- **No Prisma in services**: The `candidateService` must delegate persistence to `candidate.save()`, not call Prisma directly.
- **No business logic in controllers**: Controllers are thin HTTP adapters only.
- **Education limit** (max 3 per candidate) is enforced in the validator, not in the database schema.
- **`uploads/` directory**: Add to `.gitignore` to avoid committing uploaded files.
- **Stub `Application` model**: Needed to satisfy Prisma foreign key from `Candidate`. Do NOT implement Application endpoints in this ticket.
- **Phone validation** is optional-but-strict: if `phone` is provided, it MUST match `/^[679]\d{8}$/`.

---

## Next Steps After Implementation

- Frontend ticket (SCRUM-11-frontend): Implement `AddCandidateForm.tsx` that calls `POST /upload` then `POST /candidates`.
- Future ticket: Implement full `Application` model (currently a stub in schema).
- Consider adding `GET /candidates` endpoint in a follow-up ticket for the dashboard listing.

---

## Implementation Verification

### Code Quality
- [ ] All new files are fully typed TypeScript (no `any` except constructor `data` parameter)
- [ ] No `console.log` left in production code (use proper error handling)
- [ ] ESLint passes with no errors (`npm run lint` if configured)
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)

### Functionality
- [ ] `POST /candidates` creates candidate with nested education and work experience
- [ ] `POST /upload` stores file in `uploads/` and returns path + type
- [ ] Prisma migration applied successfully
- [ ] `npx prisma generate` reflects new models

### Testing
- [ ] All tests pass: `npm test`
- [ ] Coverage ≥ 90%: `npm run test:coverage`
- [ ] Tests are isolated (no real DB calls in unit tests — Prisma is mocked)

### Integration
- [ ] Routes are mounted in `index.ts` and reachable
- [ ] `express.json()` middleware is registered
- [ ] Prisma singleton used consistently across all files

### Documentation
- [ ] `ai-specs/specs/data-model.md` reflects Prisma schema
- [ ] `ai-specs/specs/api-spec.yml` reflects both endpoints