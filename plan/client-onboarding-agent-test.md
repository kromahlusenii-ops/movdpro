# Agent Test: Client Onboarding

**Environment**: Drive real browser, discover UI by looking (no source code access)

**Base URL**: http://localhost:3001 (or PLAYWRIGHT_BASE_URL)

**Persona behavior**:

- Patience: 7/10
- Tech level: intermediate
- Retry: exponential backoff
- On failure: retry up to 3 times, then abort

---

## Execution

For each step, narrate your thoughts like a human tester:

1. Interact with real UI: [step action]
2. Express confusion, expectations, what you see
3. Validate rendered result: [step success]
4. Screenshot browser viewport if checkpoint or failure
5. Record: difficulty (easy/moderate/difficult), duration, what was unclear
6. Retry with backoff if failed and patient

---

## Steps

### Step 1: Navigate to clients

- **Action**: Click "Clients" in the navigation sidebar
- **Validate**: Clients page loads with list or empty state
- **Screenshot**: If failure

### Step 2: Start new client

- **Action**: Click "Add Client" button
- **Validate**: New client form appears with empty fields
- **Screenshot**: If failure

### Step 3: Enter basic info ✓ CHECKPOINT

- **Action**: Fill in name (required), email (optional), phone (optional)
- **Validate**: Name field has value, form ready for next section
- **Screenshot**: Always (checkpoint)

### Step 4: Set budget range

- **Action**: Enter minimum and maximum budget values
- **Validate**: Budget fields show dollar values
- **Screenshot**: If failure

### Step 5: Select bedrooms

- **Action**: Click one or more bedroom options (Studio, 1 BR, 2 BR, 3+ BR)
- **Validate**: Selected bedroom chips appear highlighted
- **Screenshot**: If failure

### Step 6: Choose neighborhoods

- **Action**: Click neighborhood tags (South End, NoDa, etc.)
- **Validate**: Selected neighborhoods appear highlighted
- **Screenshot**: If failure

### Step 7: Add lifestyle preferences

- **Action**: Click "Lifestyle Preferences" accordion, select vibes/priorities/pets
- **Validate**: Lifestyle section expands, selections are highlighted
- **Screenshot**: If failure

### Step 8: Add notes

- **Action**: Type additional context in notes field
- **Validate**: Notes textarea shows entered text
- **Screenshot**: If failure

### Step 9: Submit client ✓ CHECKPOINT

- **Action**: Click "Add Client" button
- **Validate**: Loading spinner appears, then recommendations screen
- **Screenshot**: Always (checkpoint)

### Step 10: Review recommendations

- **Action**: Scroll through recommended listings
- **Validate**: Recommendations list displays with match scores
- **Screenshot**: If failure

### Step 11: Select listings to save

- **Action**: Click listing cards to toggle selection
- **Validate**: Selected listings show checkmark, count updates
- **Screenshot**: If failure

### Step 12: Save and finish ✓ CHECKPOINT

- **Action**: Click "Add to Client" button
- **Validate**: Redirected to client detail page with saved listings
- **Screenshot**: Always (checkpoint)

---

## Output Format

```markdown
# Test Report: Client Onboarding

**Completed**: X of 12 steps

## Step: [step name]
- **Status**: ✓ Success / ✗ Failed
- **Duration**: Xs
- **Difficulty**: easy/moderate/difficult
- **Thoughts**: [What I saw, expected, any confusion]
- **Screenshot**: [path if captured]

## Blockers
- [Any steps that couldn't be completed and why]
```

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

## Reference

User journey: `plan/story-map/client-onboarding.yaml`
