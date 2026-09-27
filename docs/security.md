# Security & Sandboxing Architecture

## Core Guarantees
1. **Zero Secret Leakage**: Provider API keys remain server-side and are never bundled into client JS.
2. **Path Traversal Protection**: Filesystem tool verifies that resolved canonical paths remain strictly within the `workspace/` boundary.
3. **Command Sanitization**: Terminal runner blocks disk-wiping, system-formatting, and malicious bash/cmd patterns.
4. **Confirmation Triggers**: Destructive file deletions and external network publishing require explicit confirmation.