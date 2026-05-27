---
name: ui-integration
description: Clarify UI integration approach before implementing - replace, add alongside, or provide both unified and individual access
---

# UI Feature Integration Clarity

Before implementing any UI change that affects existing components, clarify the integration approach with the user.

## Integration Options

1. **Replace existing components** - New feature removes/replace old UI
2. **Add alongside existing components** - New feature is an addition to existing UI
3. **Both unified and individual access** - New feature provides unified view while keeping individual access

## Pre-Implementation Checklist

- [ ] Clarify which integration approach the user wants
- [ ] Show a mock or describe the UI structure
- [ ] Get user approval before implementing
- [ ] Never remove existing access paths without explicit confirmation

## Common Mistakes

- Removing individual feature cards when user wanted both unified sync AND individual access
- Replacing UI components when user only wanted guidance/documentation
- Adding features that duplicate or conflict with existing functionality

---

## Execution

When invoked, first clarify the integration approach with the user. Ask:
- Should this new feature (1) replace existing components, (2) be added alongside existing components, or (3) provide both unified and individual access?

Then show a mock or describe the UI structure before implementing any changes.
