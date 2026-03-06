# config — Configuration

## Project Context (inherited)
Inherits from: src/CLAUDE.md

## Conventions
- Environment-specific values go in env files, not in code
- Validate configuration at startup, fail fast on missing required values
- Use typed config objects — avoid passing raw strings around
- Document every config key and its expected format
