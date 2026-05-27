---
name: prod-verify
description: Verify production environment performance and functionality after deployment - never assume local improvements equal production improvements
---

# Production Verification Workflow

After implementing any performance-related change, verify the actual production environment performance and functionality. Do not assume local improvements translate to production without confirmation.

## Steps

1. **Deploy to production**
   - Push changes to the production environment
   - Wait for deployment to complete

2. **Measure actual performance**
   - Check loading times with network throttling
   - Use browser DevTools or performance monitoring tools
   - Compare against baseline metrics

3. **Verify optimization works in production**
   - Test the specific feature/optimization
   - Confirm it works in the production environment, not just locally

4. **Investigate production-specific factors if needed**
   - Check build caching issues
   - Review CDN behavior
   - Examine Server Component execution
   - Look for production-only configuration differences

## Common Issues

- Local optimizations don't translate to production
- Build caching masks actual performance
- CDN behavior differs between environments
- Server Components execute differently in production

---

## Execution

When invoked, first deploy the changes to production. Then systematically measure performance and verify functionality. Report findings and investigate any production-specific issues if performance hasn't improved as expected.
