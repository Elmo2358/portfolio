---
name: ci-check
description: Automated pre-deployment checks for CI/CD pipelines - TypeScript, imports, and runtime issues
---

# CI/CD Pre-deployment Check

Run automated code quality checks before deployment. This skill is designed for use in CI/CD pipelines.

## Usage Examples

### Basic Pre-deployment Check
```bash
claude -p "Check for TypeScript errors, broken imports, and potential runtime issues. Report only critical problems." --allowedTools "Read,Grep,Bash" --headless
```

### Automated Code Review
```bash
claude -p "Review this PR for bugs, TypeScript issues, and Next.js best practices" --allowedTools "Read,Grep,Edit" --headless
```

## Check Items

- TypeScript errors
- Broken imports
- Potential runtime issues
- Next.js best practices violations
- Security vulnerabilities

---

## Execution

When invoked, run the appropriate check based on context:
- For pre-deployment: Use strict error reporting, only critical problems
- For PR review: Include best practices suggestions along with bugs
