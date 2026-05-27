---
name: verify-propagation
description: Verify changes propagate correctly through the entire call chain by checking all usage sites and testing with real data
---

# Verify Call Chain Propagation

Before completing any task that modifies data flow, filtering, routing, or display logic, verify the implementation at both the component level AND where it's called/used.

## Steps

1. **Search for all files that import or use this component**
   - Use `Grep` to find all usages across the codebase
   - Identify every call site that could be affected

2. **Verify the changes work correctly at each call site**
   - Check each usage location individually
   - Ensure props, data flow, and behavior are correct

3. **Test with actual data**
   - Use real data instead of mock data when possible
   - Confirm the behavior matches expectations
   - Check edge cases and boundary conditions

## Common Pitfalls

- Modified a component but didn't check where it's called from
- Changes work in isolation but break when integrated
- Mock data passes but real data fails
- Filter/display logic changes don't propagate through the entire chain

---

## Execution

When invoked, begin by searching for all usages of the target component/function using Grep. Then systematically verify each call site and test with actual data.
