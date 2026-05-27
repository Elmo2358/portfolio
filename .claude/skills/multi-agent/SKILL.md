---
name: multi-agent
description: Parallel multi-agent system for complex features - Database, UI, API, and Test agents working simultaneously with automated coordination
---

# Parallel Multi-Agent Feature Squads

Set up specialized agents to work in parallel on different aspects of large features for faster implementation.

## Four Specialized Agents

### 1. Database Agent
- Schema design and Prisma models
- Database migrations
- Data persistence and verification

### 2. UI Agent
- Component development
- Styling and responsive design
- User interaction and state management

### 3. API Agent
- API routes and server actions
- Authentication and authorization
- Data validation and error handling

### 4. Test Agent
- Unit tests and integration tests
- E2E test scenarios
- Test coverage reports

## Agent Coordination

Each agent:
1. Has access only to relevant files and contexts
2. Commits changes with standardized messages tagging their role
3. Runs integration tests before pushing
4. Coordinates through a shared task board tracking dependencies

## Conflict Resolution

When agents modify overlapping files:
- Database changes take precedence (schema drives implementation)
- API contracts must be agreed upon before UI implementation
- Test agent validates integration across all layers
- Automated PR system merges changes with conflict detection

---

## Execution

When invoked, set up the four-agent system for the target feature. Start all agents simultaneously and monitor their progress through the shared task board. Merge completed work through automated PR system. Focus on UEC Portal integration as the initial feature.

**Note**: This is an autonomous parallel workflow - agents work simultaneously and coordinate through the shared task board.
