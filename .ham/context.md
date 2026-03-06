---
tags: []
owner: ""
---

# movdpro

MOVD Pro - Professional real estate relocation platform

## Stack
- TypeScript, Next.js, React
- Styling: Tailwind CSS
- Testing: Jest, Testing Library, Playwright
- Data: Prisma, Supabase
- Linting: ESLint

## Rules
- Prefer existing patterns over introducing new ones
- Keep changes minimal and focused — do not refactor beyond what is asked
- Use TypeScript strict mode — avoid `any`
- Use App Router conventions — `"use client"` only when components need browser APIs or hooks
- Use Tailwind utility classes — do not introduce inline styles or separate CSS
- Use Prisma for all database operations
- Run `npm test` before marking work as done
- Run `npm run lint` before committing
