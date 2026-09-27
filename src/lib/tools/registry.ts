import { ToolDefinition, ToolExecutionContext, ToolResult, PermissionLevel } from "./types";

class UniversalToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  public registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  public getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public async executeTool(
    toolId: string,
    rawInput: unknown,
    context: ToolExecutionContext
  ): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolId);

    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolId}" not found in Tool Registry.`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    // Permission Verification
    if (tool.requiredPermissions.length > 0 && context.grantedPermissions) {
      for (const perm of tool.requiredPermissions) {
        if (!context.grantedPermissions.includes(perm)) {
          return {
            success: false,
            error: `Permission denied: Tool "${tool.name}" requires [${perm}] permission.`,
            executionTimeMs: Date.now() - startTime,
          };
        }
      }
    }

    // Schema Validation
    const parseResult = tool.inputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: `Invalid input schema for tool "${tool.name}": ${parseResult.error.message}`,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      const result = await tool.execute(parseResult.data, context);
      return {
        ...result,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Tool execution failed: ${err?.message || String(err)}`,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}

export const toolRegistry = new UniversalToolRegistry();
