---
name: self-heal
description: Self-healing production monitoring agent - detects anomalies, diagnoses root causes, implements fixes, and deploys hotfixes automatically
---

# Self-Healing Production Monitoring Agent

Create an autonomous monitoring system that watches production metrics and automatically resolves issues.

## Monitoring Capabilities

1. **Real-time monitoring**
   - Vercel deployment logs
   - Sentry error reports
   - Database connection metrics
   - API response times and rate limits

2. **Anomaly detection**
   - 404 error spikes
   - Build failures
   - Database timeouts
   - API rate limit breaches
   - Performance degradation

3. **Root cause analysis**
   - Analyze recent code changes
   - Check dependency updates
   - Review configuration file modifications
   - Cross-reference with deployment timeline

## Automated Resolution

4. **Implement fixes**
   - Modify code to fix bugs
   - Adjust configuration values
   - Rollback to previous deployment if needed

5. **Validation testing**
   - Smoke tests for critical paths
   - Integration tests for affected systems
   - Performance benchmarks

6. **Automatic deployment**
   - Deploy hotfixes after validation
   - Create branches and PRs for human review
   - Document changes for transparency

7. **Incident reporting**
   - Generate detailed incident reports
   - Document issue, root cause, and resolution
   - Update monitoring dashboards

## Priority Monitoring Areas

- Notification system endpoints
- AtCoder integration endpoints
- Authentication flows
- Database connections

---

## Execution

When invoked, configure the monitoring agent for the specified systems. Start with notification system and AtCoder integration endpoints. The agent runs autonomously and creates PRs for human review before production deployment when significant changes are needed.

**Agent Capabilities**: Access to deployment tools, error tracking services, ability to create branches/PRs, and automatic hotfix deployment after validation.
