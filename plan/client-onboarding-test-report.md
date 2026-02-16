# Test Report: Client Onboarding

**Script**: `plan/client-onboarding-agent-test.md`  
**Date**: 2026-02-15  
**Status**: Could not run in automated environment

---

## Blockers

Automated execution failed due to environment constraints:

1. **Web server**: Next.js dev server fails to start with `uv_interface_addresses` system error when launched by Playwright in sandboxed environments.
2. **Playwright Chromium**: Headless Chrome crashes with SIGSEGV (segmentation fault), possibly due to architecture mismatch (mac-x64 vs arm64) or sandbox restrictions.
3. **Browsers**: Playwright browsers may need to be installed with `npx playwright install` in your local environment.

---

## How to Run Successfully

### Option A: Standard (recommended)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run agent test
npm run test:e2e -- e2e/client-onboarding.spec.ts --project=chromium
```

### Option B: Skip web server (server already running)

```bash
PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e -- e2e/client-onboarding.spec.ts --project=chromium
```

### Option C: First-time setup

If you see "Executable doesn't exist" for Chromium:

```bash
npx playwright install chromium
```

---

## Test Coverage

The Playwright spec `e2e/client-onboarding.spec.ts` mirrors the 12 steps in the agent test script:

| Step | Test | Validation |
|------|------|------------|
| 1 | should navigate to clients page | Heading "Clients" visible |
| 2 | should open new client form | URL /clients/new, Name field visible |
| 3 | should validate required fields | Submit disabled when empty, enabled with name |
| 4 | should fill basic client info | Name, email, phone values |
| 5 | should set budget range | Min/max budget values |
| 6 | should select bedrooms | 1 BR, 2 BR aria-pressed |
| 7 | should select neighborhoods | South End, NoDa selected |
| 8 | should expand and fill lifestyle preferences | Accordion, Young Professional, Works from Home |
| 9 | should add notes | Notes textarea value |
| 10–12 | full onboarding flow | Submit → recommendations → select → save |
| - | should handle form cancellation | Cancel returns to /clients |

**Auth**: Tests use `/api/dev-login` in `beforeEach` when `PLAYWRIGHT_SESSION_TOKEN` is not set.

---

## Output Format (when tests run)

When tests execute, record results in this format:

```markdown
# Test Report: Client Onboarding

**Completed**: X of 12 steps
**Total Duration**: Xs
**Overall Status**: ✓ Pass / ✗ Fail

## Step Results
### Step 1: Navigate to clients
- **Status**: ✓ Success / ✗ Failed
- **Duration**: Xs
- **Difficulty**: easy
- **Thoughts**: [What I saw]
- **Screenshot**: [path if captured]

## Blockers
- [Any steps that couldn't be completed]
```

---

## Screenshots

On failure, screenshots are saved to `test-results/`. View traces with:

```bash
npx playwright show-trace test-results/<test-name>-retry1/trace.zip
```
