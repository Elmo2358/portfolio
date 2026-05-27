---
name: tdd-agent
description: Autonomous test-driven development workflow - write tests first, run parallel test suites, and only commit when 100% pass
---

# Autonomous TDD Pipeline

Set up and run continuous test-driven development with comprehensive test coverage.

## Workflow

1. **Analyze codebase structure**
   - Identify untested critical paths
   - Map component dependencies and data flows

2. **Generate comprehensive test suites**
   - Cover edge cases and integration scenarios
   - Focus on high-risk areas first (AtCoder notification system, MongoDB integration)

3. **Continuous verification pipeline**
   - Write tests before feature implementation
   - Run all tests in parallel on every change
   - Automatically fix failing tests by modifying implementation code
   - Only commit when 100% of tests pass
   - Create detailed test coverage reports

## Priority Areas

- AtCoder notification system
- MongoDB integration
- API routes and data persistence
- Authentication and authorization

---

## Execution

When invoked, begin by analyzing the current test coverage and identifying untested critical paths. Generate tests for those areas, then run the test suite. Only proceed with feature implementation after tests are written. Report any logical ambiguities or architectural decisions that require human intervention.

**Note**: This is an autonomous workflow - the agent will run independently and only request human input when encountering ambiguities or architectural decisions.
