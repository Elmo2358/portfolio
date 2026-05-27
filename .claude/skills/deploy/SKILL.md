---
name: deploy
description: Deploy to production with type checks, build verification, and testing
---

# Deploy to Production

Follow these steps to deploy to production:

1. **Type checks**: Run `pnpm tsc --noEmit` and fix any type errors
2. **Build the application**: Run `pnpm build`
3. **Check for build errors or warnings**: Review the build output carefully
4. **If successful, run deployment command**: Proceed with deployment only if steps 1-3 pass
5. **Verify production functionality**: Test the deployed application in production
6. **Commit changes**: Create a commit with message 'chore: deploy to production'

---

## Execution

Begin by checking the current git status, then proceed through each step sequentially. Stop and report any errors before proceeding to deployment.
