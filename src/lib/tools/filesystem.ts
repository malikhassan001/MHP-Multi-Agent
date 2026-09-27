import fs from "fs";
import path from "path";
import { z } from "zod";
import { ToolDefinition, ToolExecutionContext, ToolResult } from "./types";
import { toolRegistry } from "./registry";

const DEFAULT_WORKSPACE = path.resolve(process.cwd(), "workspace");

function getSafePath(relativePath: string, root?: string): string {
  const base = root ? path.resolve(root) : DEFAULT_WORKSPACE;
  const resolved = path.resolve(base, relativePath);
  if (!resolved.startsWith(base)) {
    throw new Error(`Security Violation: Path "${relativePath}" escapes sandbox boundary "${base}"`);
  }
  return resolved;
}

export const filesystemTool: ToolDefinition = {
  id: "filesystem",
  name: "Filesystem Tool",
  description: "Reads, writes, lists, patches, and manages project files safely within the sandboxed workspace.",
  category: "filesystem",
  requiredPermissions: ["FILES"],
  inputSchema: z.object({
    action: z.enum(["read", "write", "list", "delete", "tree", "patch"]),
    filePath: z.string().optional(),
    content: z.string().optional(),
    patchFind: z.string().optional(),
    patchReplace: z.string().optional(),
  }),
  execute: async (input, context: ToolExecutionContext): Promise<ToolResult> => {
    const root = context.workspaceRoot || DEFAULT_WORKSPACE;
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }

    switch (input.action) {
      case "read": {
        if (!input.filePath) throw new Error("filePath required for read action");
        const safePath = getSafePath(input.filePath, root);
        if (!fs.existsSync(safePath)) {
          return { success: false, error: `File not found: ${input.filePath}`, executionTimeMs: 0 };
        }
        const data = fs.readFileSync(safePath, "utf-8");
        return { success: true, data: { content: data, path: input.filePath }, executionTimeMs: 0 };
      }

      case "write": {
        if (!input.filePath) throw new Error("filePath required for write action");
        const safePath = getSafePath(input.filePath, root);
        fs.mkdirSync(path.dirname(safePath), { recursive: true });
        fs.writeFileSync(safePath, input.content || "", "utf-8");
        return {
          success: true,
          data: { message: `File written successfully: ${input.filePath}`, bytes: Buffer.byteLength(input.content || "") },
          artifacts: [{ name: path.basename(input.filePath), type: "code", path: input.filePath, content: input.content }],
          executionTimeMs: 0,
        };
      }

      case "patch": {
        if (!input.filePath) throw new Error("filePath required for patch action");
        if (!input.patchFind) throw new Error("patchFind string required");
        const safePath = getSafePath(input.filePath, root);
        if (!fs.existsSync(safePath)) {
          return { success: false, error: `File not found: ${input.filePath}`, executionTimeMs: 0 };
        }
        const current = fs.readFileSync(safePath, "utf-8");
        if (!current.includes(input.patchFind)) {
          return { success: false, error: `Target snippet not found in ${input.filePath}`, executionTimeMs: 0 };
        }
        const patched = current.replace(input.patchFind, input.patchReplace || "");
        fs.writeFileSync(safePath, patched, "utf-8");
        return { success: true, data: { message: `Patched ${input.filePath}` }, executionTimeMs: 0 };
      }

      case "delete": {
        if (!input.filePath) throw new Error("filePath required for delete action");
        const safePath = getSafePath(input.filePath, root);
        if (fs.existsSync(safePath)) {
          fs.rmSync(safePath, { recursive: true, force: true });
        }
        return { success: true, data: { message: `Deleted ${input.filePath}` }, executionTimeMs: 0 };
      }

      case "list":
      case "tree": {
        const targetDir = input.filePath ? getSafePath(input.filePath, root) : root;
        const readTree = (dir: string, rel = ""): any[] => {
          if (!fs.existsSync(dir)) return [];
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          return entries
            .filter((e) => !["node_modules", ".git", ".next"].includes(e.name))
            .map((entry) => {
              const full = path.join(dir, entry.name);
              const relPath = path.join(rel, entry.name).replace(/\\/g, "/");
              if (entry.isDirectory()) {
                return { name: entry.name, path: relPath, type: "directory", children: readTree(full, relPath) };
              }
              const stats = fs.statSync(full);
              return { name: entry.name, path: relPath, type: "file", size: stats.size };
            });
        };
        const tree = readTree(targetDir);
        return { success: true, data: { tree, rootPath: root }, executionTimeMs: 0 };
      }

      default:
        return { success: false, error: `Unsupported action: ${(input as any).action}`, executionTimeMs: 0 };
    }
  },
};

toolRegistry.registerTool(filesystemTool);
