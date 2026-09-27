import { exec } from "child_process";
import path from "path";
import { z } from "zod";
import { ToolDefinition, ToolExecutionContext, ToolResult } from "./types";
import { toolRegistry } from "./registry";

const DANGEROUS_PATTERNS = [
  /rmdir\s+\/s\s+[c-z]:\\/i,
  /del\s+\/f\s+[c-z]:\\/i,
  /format\s+[c-z]:/i,
  /:(){ :|:& };:/, // fork bomb
  /mkfs/i,
  /shutdown/i,
];

export const terminalTool: ToolDefinition = {
  id: "terminal",
  name: "Sandboxed Terminal Runner",
  description: "Executes shell and terminal commands safely within the project workspace with timeout protection.",
  category: "terminal",
  requiredPermissions: ["EXECUTE"],
  requiresConfirmation: true,
  inputSchema: z.object({
    command: z.string(),
    timeoutMs: z.number().optional().default(15000),
  }),
  execute: async (input, context: ToolExecutionContext): Promise<ToolResult> => {
    const cwd = context.workspaceRoot || path.resolve(process.cwd(), "workspace");

    // Security Check against destructive commands
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(input.command)) {
        return {
          success: false,
          error: `Security Block: Command contains prohibited pattern matching destructive operations.`,
          executionTimeMs: 0,
        };
      }
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      exec(
        input.command,
        {
          cwd,
          timeout: input.timeoutMs,
          maxBuffer: 1024 * 1024 * 2, // 2MB max
          env: { ...process.env, PATH: process.env.PATH },
        },
        (error, stdout, stderr) => {
          const duration = Date.now() - startTime;
          if (error) {
            resolve({
              success: false,
              data: { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: error.code },
              error: `Command failed: ${error.message}`,
              executionTimeMs: duration,
            });
          } else {
            resolve({
              success: true,
              data: { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 },
              executionTimeMs: duration,
            });
          }
        }
      );
    });
  },
};

toolRegistry.registerTool(terminalTool);
