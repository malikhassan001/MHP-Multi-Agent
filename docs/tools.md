# Tool Registry & Permissions

## Permission Tiers
Every tool invocation requires explicit permissions granted within the execution context:
- `READ`: Safe local inspection
- `WRITE`: Workspace file creation/modification
- `EXECUTE`: Shell command or test runner execution
- `NETWORK`: HTTP requests, external API calls
- `FILES`: Sandboxed directory operations
- `BROWSER`: Web scraping and DOM parsing
- `DATABASE`: Relational database operations
- `SYSTEM`: Low-level system access (restricted)

## Security Boundaries
1. Filesystem sandbox rooted in `workspace/` prevents path traversal (`../`).
2. Destructive command interception blocks dangerous commands (`format`, `rmdir /s`, fork bombs).
3. Configurable timeout limits and output buffer caps prevent runaway memory consumption.