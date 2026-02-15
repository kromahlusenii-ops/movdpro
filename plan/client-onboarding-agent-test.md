# Agent Test: Client Onboarding

**Environment**: Drive real browser, discover UI by looking (no source code access)

**Base URL**: http://localhost:3001 (or production URL)

**Persona Behavior**:
- Patience: 7/10
- Tech Level: intermediate
- Retry Strategy: exponential backoff
- On Failure: retry up to 3 times, then abort

---

## Test Data

```yaml
client:
  name: "Alex Thompson"
  email: "alex.thompson@example.com"
  phone: "(704) 555-1234"
  budgetMin: 1500
  budgetMax: 2200
  bedrooms: ["1 BR", "2 BR"]
  neighborhoods: ["South End", "NoDa"]
  vibes: ["Young Professional"]
  worksFromHome: true
  notes: "Moving for new job at Bank of America. Prefers walkable area."
```

---

## Execution Steps

### Step 1: Navigate to Clients

**Action**: Navigate to /clients or find "Clients" in sidebar navigation

**Narration**: Looking for the clients section. I expect to see a navigation menu on the left side of the dashboard.

**Validate**:
- Page title contains "Clients"
- URL is /clients
- Page shows either client list or empty state

**Screenshot**: If failure

**Record**:
- Difficulty: easy/moderate/difficult
- Duration: Xs
- Notes: [what was unclear]

---

### Step 2: Start New Client

**Action**: Click element containing "Add Client" text or Plus icon

**Narration**: Looking for a button to add a new client. I expect it to be prominent, possibly in the header area.

**Validate**:
- URL changes to /clients/new
- Form appears with input fields
- Name field is visible and focusable

**Screenshot**: If failure

---

### Step 3: Enter Basic Info ✓ CHECKPOINT

**Action**:
1. Find input with label "Name" and enter "Alex Thompson"
2. Find input with label "Email" and enter "alex.thompson@example.com"
3. Find input with label "Phone" and enter "(704) 555-1234"

**Narration**: Filling in the client's basic contact information. The name field appears to be required based on the asterisk.

**Validate**:
- Name input contains "Alex Thompson"
- Email input contains the email address
- Phone input contains the phone number
- No error messages visible

**Screenshot**: Always (checkpoint)

---

### Step 4: Set Budget Range

**Action**:
1. Find input for minimum budget, enter "1500"
2. Find input for maximum budget, enter "2200"

**Narration**: Setting the budget range. Looking for two number inputs, possibly with dollar signs.

**Validate**:
- Min budget field shows 1500
- Max budget field shows 2200

**Screenshot**: If failure

---

### Step 5: Select Bedrooms

**Action**: Click buttons/chips containing "1 BR" and "2 BR"

**Narration**: Selecting bedroom preferences. These appear to be toggle buttons - I can select multiple.

**Validate**:
- "1 BR" button has selected/active state (different background color)
- "2 BR" button has selected/active state
- aria-pressed="true" on both buttons (if checking accessibility)

**Screenshot**: If failure

---

### Step 6: Choose Neighborhoods

**Action**: Click chips/buttons for "South End" and "NoDa"

**Narration**: Choosing neighborhoods. I see a list of Charlotte neighborhoods as selectable tags.

**Validate**:
- "South End" chip is selected (visual change)
- "NoDa" chip is selected
- Both remain selected (multi-select works)

**Screenshot**: If failure

---

### Step 7: Expand Lifestyle Preferences

**Action**:
1. Click accordion header containing "Lifestyle Preferences"
2. Wait for expansion animation
3. Click "Young Professional" in vibes section
4. Click "Works from Home" toggle

**Narration**: Expanding the optional lifestyle section. I see an accordion that reveals additional preference options.

**Validate**:
- Accordion is expanded (content visible)
- "Young Professional" is selected
- "Works from Home" button shows selected state

**Screenshot**: If failure

---

### Step 8: Add Notes

**Action**: Find textarea with label "Notes" and enter the notes text

**Narration**: Adding additional context about the client in the notes field.

**Validate**:
- Textarea contains the entered text
- No character limit warning (if applicable)

**Screenshot**: If failure

---

### Step 9: Submit Client ✓ CHECKPOINT

**Action**: Click button containing "Add Client" text

**Narration**: Submitting the form. I expect to see a loading state followed by recommendations.

**Validate**:
- Loading spinner appears briefly
- URL changes (either to recommendations view or /clients)
- No error messages appear
- Either: recommendations screen shows OR redirected to clients list

**Screenshot**: Always (checkpoint)

---

### Step 10: Review Recommendations

**Action**: Observe the recommendations page content

**Narration**: Looking at the AI-matched recommendations. I can see listings with photos, names, and match scores.

**Validate**:
- Page shows "Recommended Listings" heading
- At least one listing card is visible
- Match scores are displayed (percentage format)

**Screenshot**: If present, capture recommendations

---

### Step 11: Select Listings

**Action**: Click on 2-3 listing cards to select them

**Narration**: Selecting promising listings to save to the client. Clicking toggles the selection.

**Validate**:
- Clicked listings show selected state (checkmark, border change)
- Selection count updates (e.g., "2 selected")

**Screenshot**: If failure

---

### Step 12: Save and Finish ✓ CHECKPOINT

**Action**: Click button containing "Add to Client" text

**Narration**: Saving the selected listings and completing the onboarding flow.

**Validate**:
- URL changes to /clients/{id} (client detail page)
- Saved listings appear on the client profile
- Client name "Alex Thompson" is visible on the page

**Screenshot**: Always (checkpoint)

---

## Output Format

```markdown
# Test Report: Client Onboarding

**Completed**: X of 12 steps
**Total Duration**: Xs
**Overall Status**: ✓ Pass / ✗ Fail

## Step Results

### Step 1: Navigate to Clients
- **Status**: ✓ Success / ✗ Failed
- **Duration**: Xs
- **Difficulty**: easy
- **Thoughts**: [What I saw, expected, any confusion]
- **Screenshot**: [path if captured]

### Step 2: Start New Client
- **Status**: ✓ Success
- **Duration**: Xs
- **Difficulty**: easy
- **Thoughts**: Add Client button was prominent in header

[... continue for all steps ...]

## Checkpoints

| Checkpoint | Status | Screenshot |
|------------|--------|------------|
| Basic Info | ✓ | /screenshots/checkpoint-1.png |
| Submit Client | ✓ | /screenshots/checkpoint-2.png |
| Save & Finish | ✓ | /screenshots/checkpoint-3.png |

## Blockers

- [Any steps that couldn't be completed and why]

## Recommendations

- [Suggested improvements based on friction encountered]
```

---

## Error Handling

**On element not found**:
1. Wait 2 seconds, retry
2. Try alternative selectors (aria-label, placeholder text)
3. Screenshot current state
4. If checkpoint, abort. Otherwise, skip and continue.

**On validation failure**:
1. Screenshot current state
2. Log expected vs actual
3. Continue to next step (don't abort)

**On page error (500, 404)**:
1. Screenshot error page
2. Abort test
3. Report in blockers section
