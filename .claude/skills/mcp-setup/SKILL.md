---
name: mcp-setup
description: Set up Model Context Protocol (MCP) servers for external integrations like GitHub and databases
---

# MCP Integration Setup

Model Context Protocol (MCP) servers allow Claude to connect to external tools and services.

## Available Integrations

### GitHub Integration
```bash
claude mcp add github -- npx -y @modelcontextprotocol/server-github
```
**Use for:**
- Searching GitHub for related issues
- Creating and managing pull requests
- Checking commit history and code changes

### Database Integration (PostgreSQL)
```bash
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres postgresql://user:pass@localhost:5432/db
```
**Use for:**
- Querying the database directly
- Verifying data persistence
- Checking schema and migrations

## Usage Examples

Once configured, you can ask Claude to:
- "Search GitHub for related issues"
- "Query the database for user records"
- "Check the database schema for the problems table"

---

## Execution

Before setting up any MCP server, verify:
1. Required credentials/tokens are available
2. Network access to the service
3. Security implications of granting access

Run the appropriate MCP add command based on the integration needed.
