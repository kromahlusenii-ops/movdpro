# Agent Test: Search, Add to Client, Share Report, Email

**Environment**: Drive real browser, discover UI by looking (no source code access)

**Base URL**: http://localhost:3001

**Persona behavior**: Patience 7/10 • Retry: exponential backoff • On failure: retry up to 3 times

---

## Test Data

```yaml
client:
  name: "Share Test"
  email: "luiikromah@gmail.com"
recipient: luiikromah@gmail.com
```

---

## Execution

For each step: interact with UI, validate result, screenshot on checkpoint/failure.

---

## Steps

### Step 1: Create or select client ✓ CHECKPOINT

- **Action**: Create client "Share Test" with email luiikromah@gmail.com (via Add Client form)
- **Validate**: Client appears in list or can navigate to client detail
- **Screenshot**: Always (checkpoint)

### Step 2: Navigate to search

- **Action**: Click "Search" in nav or go to /search
- **Validate**: Search page loads, heading "Search" visible
- **Screenshot**: If failure

### Step 3: Search for listings

- **Action**: Ensure listings mode, wait for/trigger search (filters may apply on load)
- **Validate**: Listing cards visible with rent, bedrooms, neighborhood
- **Screenshot**: If failure

### Step 4: Review listings ✓ CHECKPOINT

- **Action**: Scroll through listings, observe content
- **Validate**: Multiple listings visible with key details
- **Screenshot**: Always (checkpoint)

### Step 5: Add listings to client

- **Action**: Click "Save" on first listing → select "Share Test" in dropdown. Repeat for 2–3 listings.
- **Validate**: Status shows "Saved to Share Test" or checkmark on client in dropdown
- **Screenshot**: If failure

### Step 6: Open client detail

- **Action**: Go to /clients, click "Share Test"
- **Validate**: Client detail page, saved listings section has items
- **Screenshot**: If failure

### Step 7: Generate share report

- **Action**: Click "Share" button
- **Validate**: Share dialog opens, share URL visible
- **Screenshot**: If failure

### Step 8: Send report via email ✓ CHECKPOINT

- **Action**: Click "Send to luiikromah@gmail.com" (or "Send to [email]" button)
- **Validate**: "Email Sent!" or success state
- **Screenshot**: Always (checkpoint)

---

## Output Format

```markdown
# Test Report: Search Share Report

**Completed**: X of 8 steps

## Step Results
[Status, Duration, Difficulty, Thoughts, Screenshot]

## Blockers
[Any steps that couldn't be completed]
```

---

## Reference

Journey: `plan/story-map/search-share-report.yaml`
