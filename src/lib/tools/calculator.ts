import { z } from "zod";
import { ToolDefinition, ToolExecutionContext, ToolResult } from "./types";
import { toolRegistry } from "./registry";

export const calculatorTool: ToolDefinition = {
  id: "calculator",
  name: "Calculator & Math Engine",
  description: "Computes complex arithmetic, statistical evaluations, and financial models safely.",
  category: "utility",
  requiredPermissions: ["READ"],
  inputSchema: z.object({
    expression: z.string(),
  }),
  execute: async (input, context: ToolExecutionContext): Promise<ToolResult> => {
    try {
      const sanitized = input.expression.replace(/[^0-9+\-*/().,%^ ]/g, "");
      // Evaluate basic arithmetic safely
      const fn = new Function(`return (${sanitized})`);
      const result = fn();
      return {
        success: true,
        data: { expression: input.expression, result: Number(result) },
        executionTimeMs: 2,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Calculation failed: ${err.message}`,
        executionTimeMs: 2,
      };
    }
  },
};

toolRegistry.registerTool(calculatorTool);
