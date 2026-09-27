import { z } from "zod";

export type PermissionLevel =
  | "READ"
  | "WRITE"
  | "EXECUTE"
  | "NETWORK"
  | "FILES"
  | "DATABASE"
  | "BROWSER"
  | "SYSTEM";

export type ToolCategory =
  | "filesystem"
  | "terminal"
  | "code_runner"
  | "browser"
  | "document"
  | "media"
  | "data"
  | "utility";

export interface ToolExecutionContext {
  projectId?: string;
  conversationId?: string;
  callerAgentId?: string;
  grantedPermissions?: PermissionLevel[];
  workspaceRoot?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  artifacts?: {
    name: string;
    type: string;
    path?: string;
    content?: string;
  }[];
  executionTimeMs: number;
}

export interface ToolDefinition<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  requiredPermissions: PermissionLevel[];
  requiresConfirmation?: boolean;
  inputSchema: z.ZodSchema<TInput>;
  execute: (input: TInput, context: ToolExecutionContext) => Promise<ToolResult<TOutput>>;
}
