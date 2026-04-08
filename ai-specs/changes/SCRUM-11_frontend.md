# Frontend Implementation Plan: SCRUM-11 — Add Candidate to the System

## Overview

This plan covers the full frontend implementation for adding a candidate to the ATS system. The feature requires:

1. A two-step API flow: first `POST /upload` to upload the CV file, then `POST /candidates` with the assembled payload.
2. A multi-section form with dynamic Education (max 3) and Work Experience arrays.
3. A Dashboard entry point with an "Add Candidate" button.
4. React Router routing between the Dashboard and the form.

The frontend is currently a skeleton Create React App (`App.tsx` renders the default CRA page). All project-standard dependencies (React Bootstrap, React Router, Axios) must be installed — they are listed in `ai-specs/specs/frontend-standards.mdc` as part of the tech stack but are not yet in `frontend/package.json`.

---

## Architecture Context

### Components / Services Involved

| File | Type | Action |
|---|---|---|
| `frontend/src/services/candidateService.ts` | Service | **CREATE** — `uploadCV()`, `addCandidate()` |
| `frontend/src/components/Dashboard.tsx` | Component | **CREATE** — entry page with "Add Candidate" button |
| `frontend/src/components/AddCandidateForm.tsx` | Component | **CREATE** — full multi-section form |
| `frontend/src/App.tsx` | App | **MODIFY** — add BrowserRouter, routes, Bootstrap CSS import |
| `frontend/src/index.tsx` | Entry | **MODIFY** — no change needed (Bootstrap imported in App.tsx) |
| `frontend/.env` | Config | **CREATE** — `REACT_APP_API_URL` |
| `frontend/src/tests/App.test.tsx` | Test | **MODIFY** — update to match new App routes |

### Routing

```
/                  → Dashboard      (default landing page)
/candidates/new    → AddCandidateForm
```

Use `BrowserRouter` in `App.tsx`. Navigation with `useNavigate` hook.

### State Management

Local `useState` hooks only — no global state. `AddCandidateForm` manages:
- `personalInfo`: scalar fields
- `educations`: `EducationInput[]` (dynamic array)
- `workExperiences`: `WorkExperienceInput[]` (dynamic array)
- `cv`: `CvInput | null` (set after successful upload)
- `isUploadingCv`, `isSubmitting`: booleans
- `successMessage`, `errorMessage`: strings

---

## Implementation Steps

### Step 0: Verify / Create Feature Branch

- **Action**: Ensure we are on branch `feature/SCRUM-11-frontend` (not `main`).
- **Branch name**: `feature/SCRUM-11-frontend`
- **Implementation Steps**:
  1. `git checkout main && git pull origin main`
  2. Check if branch exists: `git branch | grep feature/SCRUM-11-frontend`
  3. If it doesn't exist: `git checkout -b feature/SCRUM-11-frontend`
  4. If it exists: `git checkout feature/SCRUM-11-frontend`
  5. Verify: `git branch`
- **Notes**: Never work on `main` directly. Branch already exists from a prior interrupted attempt — re-use it.

---

### Step 1: Install Dependencies

- **File**: `frontend/package.json`
- **Action**: Install all project-standard packages that are missing.
- **Implementation Steps**:
  1. From `frontend/` directory:
     ```bash
     npm install bootstrap react-bootstrap react-router-dom axios
     npm install --save-dev @types/react-router-dom
     ```
  2. Verify all four appear in `package.json` dependencies:
     - `bootstrap` ~5.x
     - `react-bootstrap` ~2.x
     - `react-router-dom` ~6.x
     - `axios` ~1.x
- **Notes**: These are part of the project standard stack (`frontend-standards.mdc`). No justification needed — do NOT introduce any other package.

---

### Step 2: Create Frontend Environment File

- **File**: `frontend/.env`
- **Action**: Create environment file with API base URL.
- **Content**:
  ```env
  REACT_APP_API_URL=http://localhost:3010
  ```
- **Notes**: The backend runs on port 3010 (per `backend/src/index.ts`). The service layer reads this as `process.env.REACT_APP_API_URL`. Add `frontend/.env` to `.gitignore` if not already there (it's a dev-only file, not a secret here, but keep consistent with project practice — check `.gitignore` first).

---

### Step 3: Create Service Layer — `candidateService.ts`

- **File**: `frontend/src/services/candidateService.ts`
- **Action**: Implement all API communication for the candidate feature.
- **Types to export**:
  ```typescript
  export type EducationInput = {
      institution: string;
      title: string;
      startDate: string;     // ISO8601 date string
      endDate?: string;
  };

  export type WorkExperienceInput = {
      company: string;
      position: string;
      description?: string;
      startDate: string;
      endDate?: string;
  };

  export type CvInput = {
      filePath: string;
      fileType: string;
  };

  export type CreateCandidatePayload = {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      address?: string;
      educations?: EducationInput[];
      workExperiences?: WorkExperienceInput[];
      cv?: CvInput;
  };

  export type CandidateResponse = {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string | null;
      address?: string | null;
  };

  export type UploadResponse = {
      filePath: string;
      fileType: string;
  };
  ```
- **Functions to export**:
  ```typescript
  export const candidateService = {
      uploadCV: async (file: File): Promise<UploadResponse>
      addCandidate: async (payload: CreateCandidatePayload): Promise<CandidateResponse>
  };
  ```
- **Implementation Steps**:
  1. Define `const API_BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:3010';`
  2. `uploadCV`: build a `FormData`, append the file under key `'file'`, POST to `${API_BASE_URL}/upload` with `Content-Type: multipart/form-data`. Return `response.data`.
  3. `addCandidate`: POST to `${API_BASE_URL}/candidates` with `payload` as JSON body. Return `response.data`.
  4. Do NOT wrap in try-catch inside the service — let errors propagate to the component so it can extract `err.response?.data?.error` for user-facing messages.
- **Dependencies**: `import axios from 'axios';`

---

### Step 4: Create `Dashboard.tsx` Component

- **File**: `frontend/src/components/Dashboard.tsx`
- **Action**: Simple landing page with an "Add Candidate" button that navigates to the form.
- **Component signature**:
  ```typescript
  const Dashboard: React.FC = () => { ... }
  export default Dashboard;
  ```
- **Implementation Steps**:
  1. Import `useNavigate` from `react-router-dom`.
  2. Import `Container`, `Button`, `Card` from `react-bootstrap`.
  3. Render a `Container` with a heading "Recruiter Dashboard".
  4. Render a `Button` labelled "Add Candidate" that calls `navigate('/candidates/new')` on click.
  5. Add `data-testid="btn-add-candidate"` to the button.
  6. Add `aria-label="Add new candidate"` to the button.
- **Dependencies**: `react`, `react-router-dom`, `react-bootstrap`

---

### Step 5: Create `AddCandidateForm.tsx` Component

- **File**: `frontend/src/components/AddCandidateForm.tsx`
- **Action**: Full multi-section controlled form for adding a candidate.
- **Component signature**:
  ```typescript
  const AddCandidateForm: React.FC = () => { ... }
  export default AddCandidateForm;
  ```
- **State shape**:
  ```typescript
  // Personal info
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
      firstName: '', lastName: '', email: '', phone: '', address: ''
  });
  // Dynamic arrays
  const [educations, setEducations] = useState<EducationInput[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceInput[]>([]);
  // CV
  const [cv, setCv] = useState<CvInput | null>(null);
  const [cvFileName, setCvFileName] = useState<string>('');
  // UI states
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  ```
- **Implementation Steps**:

  **Section layout** (all wrapped in `<Form onSubmit={handleSubmit} noValidate>`):

  1. **Back button**: `← Back to Dashboard` (`useNavigate`, `data-testid="back-to-dashboard"`)
  2. **Success/Error Alerts**: Bootstrap `Alert` components. `data-testid="success-alert"` and `data-testid="error-alert"`.
  3. **Personal Information Card** (`Card` with `Card.Header` + `Card.Body`):
     - `firstName` / `lastName` in a `Row` with two `Col md={6}` (required)
     - `email` full width (required)
     - `phone` / `address` in a `Row` with two `Col md={6}` (optional)
     - All inputs: controlled, `name` attribute, `onChange={handlePersonalInfoChange}`, `data-testid="input-{fieldName}"`, `aria-label`
  4. **Education Card**:
     - Header has `+ Add Education` button (`data-testid="btn-add-education"`) — disabled when `educations.length >= 3`
     - Empty state message when array is empty (`data-testid="education-empty-message"`)
     - Each item is a nested `Card` with `data-testid="education-item-{index}"`
     - Fields per item: `institution` (required), `title` (required), `startDate` date input (required), `endDate` date input (optional, hint "Leave empty if ongoing")
     - Remove button per item: `data-testid="btn-remove-education-{index}"`
  5. **Work Experience Card**:
     - Header has `+ Add Experience` button (`data-testid="btn-add-experience"`) — no upper limit
     - Empty state message when array is empty (`data-testid="experience-empty-message"`)
     - Each item is a nested `Card` with `data-testid="experience-item-{index}"`
     - Fields per item: `company` (required), `position` (required), `startDate` date (required), `description` textarea (optional, maxLength=200), `endDate` date (optional, hint "Leave empty if current")
     - Remove button: `data-testid="btn-remove-experience-{index}"`
  6. **CV Upload Card**:
     - `type="file"` input, `accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"`
     - `data-testid="input-cv-file"`
     - On change: call `handleCvChange` which calls `candidateService.uploadCV(file)` — show `Spinner` while uploading (`data-testid="cv-uploading"`), show success text with filename on completion (`data-testid="cv-upload-success"`), show `errorMessage` on failure
  7. **Submit / Cancel buttons**:
     - Submit: `data-testid="btn-submit"`, disabled when `isSubmitting || isUploadingCv`, shows `Spinner` while submitting
     - Cancel: `data-testid="btn-cancel"`, calls `navigate('/')`

  **Event handlers**:
  - `handlePersonalInfoChange(e)` — updates `personalInfo` using `e.target.name`
  - `handleAddEducation()` — appends empty education to array (guard: `length < 3`)
  - `handleRemoveEducation(index)` — filters array by index
  - `handleEducationChange(index, field, value)` — immutable update of specific item+field
  - `handleAddExperience()` — appends empty experience
  - `handleRemoveExperience(index)` — filters array
  - `handleExperienceChange(index, field, value)` — immutable update
  - `handleCvChange(e)` — async: calls `uploadCV`, sets `cv` state + `cvFileName` on success
  - `handleSubmit(e)` — async: calls `addCandidate` with assembled payload; on success shows message + resets form; on error shows error message

  **Payload assembly in `handleSubmit`**:
  - Strip empty strings for optional fields (`phone`, `address` → `undefined` if `''`)
  - Strip empty strings for optional nested fields (`endDate`, `description` → `undefined` if `''`)
  - Only include `educations` / `workExperiences` if arrays are non-empty
  - Include `cv` only if `cv !== null`

- **Dependencies**: `react`, `react-router-dom`, `react-bootstrap`, `../services/candidateService`

---

### Step 6: Update `App.tsx` — Add Routing and Bootstrap

- **File**: `frontend/src/App.tsx`
- **Action**: Replace the default CRA content with React Router + Bootstrap setup.
- **Implementation Steps**:
  1. Add `import 'bootstrap/dist/css/bootstrap.min.css';` as the **first import** (before App.css or instead of it).
  2. Import `BrowserRouter, Routes, Route` from `react-router-dom`.
  3. Import `Dashboard` and `AddCandidateForm` components.
  4. Replace the return with:
     ```tsx
     <BrowserRouter>
       <Routes>
         <Route path="/" element={<Dashboard />} />
         <Route path="/candidates/new" element={<AddCandidateForm />} />
       </Routes>
     </BrowserRouter>
     ```
  5. Keep the function as `function App()` (not arrow function) for CRA compatibility.
  6. Remove all existing CRA placeholder JSX and unused imports (`logo`, `./App.css`).
- **Notes**: Do NOT wrap `BrowserRouter` in `index.tsx` — keep it in `App.tsx` so it's testable via `MemoryRouter` in unit tests.

---

### Step 7: Update `App.test.tsx`

- **File**: `frontend/src/tests/App.test.tsx`
- **Action**: Update the existing test to work with the new routing-based App.
- **Implementation Steps**:
  1. Replace the existing `renders learn react link` test (the old CRA link no longer exists).
  2. Import `MemoryRouter` from `react-router-dom` for wrapping.
  3. Write a test: wrap `<App />` in `<MemoryRouter>` (or use `<BrowserRouter>` — but `MemoryRouter` is safer in tests) — actually since `App.tsx` already has `BrowserRouter`, rendering `<App />` directly will work; use `MemoryRouter` if you strip `BrowserRouter` from `App.tsx`.
  4. Assert that the Dashboard heading `"Recruiter Dashboard"` is visible.
  5. Assert that the "Add Candidate" button is visible.
- **Implementation Notes**: Jest config (`jest.config.js`) already points to `src/tests/` and uses `ts-jest`. No changes to jest config needed.

---

### Step 8: Create Cypress E2E Tests

- **File**: `frontend/cypress/e2e/candidates.cy.ts`
- **Action**: Write E2E tests covering the three main flows.
- **Implementation Steps**:
  1. Set up Cypress config at `frontend/cypress.config.ts`:
     ```typescript
     import { defineConfig } from 'cypress';
     export default defineConfig({
       e2e: {
         baseUrl: 'http://localhost:3000',
         env: { API_URL: 'http://localhost:3010' },
       },
     });
     ```
  2. Create `frontend/cypress/e2e/candidates.cy.ts` with three describe blocks:

  **Happy path**:
  - Visit `/`
  - Click `[data-testid="btn-add-candidate"]`
  - Fill `[data-testid="input-firstName"]`, `lastName`, `email`
  - Click `[data-testid="btn-submit"]`
  - Assert `[data-testid="success-alert"]` is visible

  **Validation error from backend**:
  - Intercept `POST /candidates` and reply `400 { error: 'email format is invalid' }`
  - Submit the form
  - Assert `[data-testid="error-alert"]` contains `'email format is invalid'`

  **Duplicate email**:
  - Intercept `POST /candidates` and reply `400 { error: 'Email already exists' }`
  - Submit the form
  - Assert `[data-testid="error-alert"]` contains `'Email already exists'`

  **UI behaviours**:
  - Click `[data-testid="btn-add-education"]` 3 times → button becomes disabled
  - Click `[data-testid="btn-remove-education-0"]` → button re-enables
  - Click `[data-testid="btn-back-to-dashboard"]` → lands on Dashboard

- **Notes**: Cypress must be installed (`npm install --save-dev cypress`). This is the only additional dev dependency allowed. Add `cypress/` to `.gitignore` only for screenshots/videos (not the test files).

---

### Step 9: Update Technical Documentation

- **Action**: Reflect all frontend changes in project documentation.
- **Implementation Steps**:
  1. **`ai-specs/specs/frontend-standards.mdc`**: Verify the tech stack section already lists the newly installed packages (Bootstrap, React Bootstrap, React Router, Axios) — they are already documented there. No content change needed unless a new pattern was introduced.
  2. **`ai-specs/specs/api-spec.yml`**: No frontend changes to API spec — backend already handles this.
  3. No other documentation changes needed for this feature.
- **Notes**: This step is MANDATORY before marking the ticket complete.

---

## Implementation Order

1. Step 0 — Verify/create branch `feature/SCRUM-11-frontend`
2. Step 1 — Install npm packages (bootstrap, react-bootstrap, react-router-dom, axios, @types/react-router-dom)
3. Step 2 — Create `frontend/.env`
4. Step 3 — Create `frontend/src/services/candidateService.ts`
5. Step 4 — Create `frontend/src/components/Dashboard.tsx`
6. Step 5 — Create `frontend/src/components/AddCandidateForm.tsx`
7. Step 6 — Update `frontend/src/App.tsx`
8. Step 7 — Update `frontend/src/tests/App.test.tsx`
9. Step 8 — Create Cypress config + `frontend/cypress/e2e/candidates.cy.ts`
10. Step 9 — Update technical documentation

---

## Testing Checklist

### Unit tests (`npm test`)
- [ ] `App.test.tsx` renders Dashboard with "Add Candidate" button
- [ ] All existing tests still pass

### Manual / E2E
- [ ] Dashboard loads at `/`, "Add Candidate" button is visible
- [ ] Clicking "Add Candidate" navigates to `/candidates/new`
- [ ] Form renders all personal info fields with correct `data-testid` attributes
- [ ] "Add Education" adds a row; disabled at 3 entries
- [ ] "Remove Education" removes the correct row
- [ ] "Add Experience" adds a row (no upper limit)
- [ ] "Remove Experience" removes the correct row
- [ ] CV file picker only accepts PDF/DOCX
- [ ] Selecting a valid PDF triggers `POST /upload` and shows filename on success
- [ ] Selecting an invalid file type shows error alert
- [ ] Submit button is disabled while `isSubmitting` or `isUploadingCv`
- [ ] Successful submit shows success alert and resets the form
- [ ] Backend 400 error shows error alert with server message
- [ ] Backend 500 error shows generic error alert
- [ ] "Cancel" navigates back to Dashboard
- [ ] "← Back to Dashboard" navigates back to Dashboard
- [ ] Responsive layout on mobile (Bootstrap grid)

### Cypress E2E
- [ ] Happy path: form submit → success alert visible
- [ ] 400 validation error intercepted → error alert shows correct message
- [ ] Duplicate email intercepted → error alert shows "Email already exists"
- [ ] Education "Add" button disables at 3 entries
- [ ] Back navigation returns to Dashboard

---

## Error Handling Patterns

| Scenario | Error source | UI response |
|---|---|---|
| CV upload fails (wrong type) | `err.response?.data?.error` | Set `errorMessage`, clear `cv` state |
| CV upload fails (server) | `err.response?.data?.error` | Set `errorMessage` |
| Submit fails (validation) | `err.response?.data?.error` | Set `errorMessage` with server message |
| Submit fails (dup email) | `err.response?.data?.error === 'Email already exists'` | Set `errorMessage` |
| Submit fails (no response) | `err.message` fallback | Set generic `errorMessage` |

**Pattern**: Never throw inside the service. Always catch in the component:
```typescript
} catch (err: any) {
    const msg = err.response?.data?.error ?? 'An unexpected error occurred. Please try again.';
    setErrorMessage(msg);
}
```

---

## UI/UX Considerations

### Bootstrap Components Used
| Component | Usage |
|---|---|
| `Container` | Page wrapper (max-width 800px for form) |
| `Card` + `Card.Header` + `Card.Body` | Section grouping (Personal Info, Education, etc.) |
| `Form`, `Form.Group`, `Form.Label`, `Form.Control` | All form inputs |
| `Form.Text` | Hints (e.g., "Leave empty if ongoing") |
| `Button` | Add/Remove/Submit/Cancel actions |
| `Alert` | Success and error messages (dismissible) |
| `Spinner` | Loading state for upload and submit |
| `Row`, `Col` | Responsive two-column layouts |

### Responsive Design
- Personal info: `firstName`/`lastName` in `Col md={6}` each, email full width
- `phone`/`address` in `Col md={6}` each
- Education and Experience date fields in `Col md={6}` each
- On mobile (<768px) all cols stack vertically

### Accessibility
- Every `Form.Control` has a `Form.Label` with matching `controlId`
- Every interactive element has an `aria-label`
- All interactive elements have `data-testid` for Cypress
- Disabled states communicated via `disabled` attribute

### Loading States
- CV upload: `Spinner` + "Uploading…" text, file input disabled
- Form submit: `Spinner` + "Adding Candidate…" text in submit button, button disabled

---

## Dependencies

| Package | Type | Justification |
|---|---|---|
| `bootstrap` | runtime | CSS framework — project standard |
| `react-bootstrap` | runtime | React component wrappers — project standard |
| `react-router-dom` | runtime | Client-side routing — project standard |
| `axios` | runtime | HTTP client — project standard |
| `@types/react-router-dom` | dev | TypeScript types for router hooks |
| `cypress` | dev | E2E testing — project standard (Step 8 only) |

All of the above are listed in `ai-specs/specs/frontend-standards.mdc`. No new dependencies may be added.

---

## Notes

- **English only**: All variable names, component names, labels, comments, and error messages must be in English (per `base-standards.mdc`).
- **TypeScript**: `AddCandidateForm.tsx`, `Dashboard.tsx`, `candidateService.ts` must all be `.ts/.tsx` files with proper type definitions.
- **No global state**: All state is local to `AddCandidateForm`. No Redux, no Context needed.
- **Service layer**: Components never call `axios` directly — all API calls go through `candidateService`.
- **CV upload flow**: Upload happens on file selection (not on form submit) to get `filePath` before the main POST.
- **Form reset**: After a successful submit, reset `personalInfo`, `educations`, `workExperiences`, `cv`, `cvFileName` to initial values.
- **Education max**: The Add button must be disabled when `educations.length >= 3`, NOT enforced only via validation — disabled in UI.
- **Branch naming**: `feature/SCRUM-11-frontend` — do NOT use the generic `SCRUM-11` branch.

---

## Next Steps After Implementation

- Frontend is blocked on backend `feature/SCRUM-11-backend` being merged or at least available locally (starts on port 3010).
- After merge, a QA pass should verify the full flow end-to-end with a real database.
- Cypress tests require both frontend (port 3000) and backend (port 3010) running simultaneously.

---

## Implementation Verification

### Code Quality
- [ ] TypeScript compiles without errors: `npx tsc --noEmit` (in `frontend/`)
- [ ] No `any` types except where unavoidable (Axios error catch)
- [ ] All form fields have `data-testid`, `aria-label`, and `Form.Label`
- [ ] No direct `axios` calls in components — service layer only

### Functionality
- [ ] `/` route renders `Dashboard`
- [ ] `/candidates/new` route renders `AddCandidateForm`
- [ ] Education "Add" button disables at 3 records
- [ ] CV upload fires `POST /upload` on file selection
- [ ] Form submit fires `POST /candidates` with correct payload shape
- [ ] Form resets after successful submit

### Testing
- [ ] `npm test` passes with updated `App.test.tsx`
- [ ] Cypress E2E: happy path, error handling, UI interactions

### Integration
- [ ] Backend API reachable at `http://localhost:3010`
- [ ] Bootstrap CSS applied correctly (no unstyled components)
- [ ] React Router navigates correctly between routes

### Documentation
- [ ] `frontend-standards.mdc` verified — no updates needed
- [ ] Plan file `ai-specs/changes/SCRUM-11_frontend.md` committed
