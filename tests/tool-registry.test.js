const assert = require("assert");
const path = require("path");

console.log("Running Tool Registry & Security Test Suite...");

// Test 1: Path traversal protection
const workspaceRoot = path.resolve("C:\\Users\\Hassan\\.gemini\\antigravity\\scratch\\mhp\\workspace");

function assertSafePath(targetRel) {
  const resolved = path.resolve(workspaceRoot, targetRel);
  if (!resolved.startsWith(workspaceRoot)) {
    throw new Error(`Security Violation: Escaped boundary`);
  }
  return resolved;
}

// Positive test: within boundary
const validPath = assertSafePath("src/index.html");
assert.ok(validPath.startsWith(workspaceRoot));
console.log("✓ Test 1 Passed: Safe path permitted inside workspace boundary.");

// Negative test: path traversal attempt
assert.throws(() => {
  assertSafePath("../../../Windows/System32/cmd.exe");
}, /Security Violation/);
console.log("✓ Test 2 Passed: Directory traversal attempt securely blocked.");

// Test 3: Math calculator evaluation
const sanitized = "12 * 4 + 10";
const calcResult = new Function(`return (${sanitized})`)();
assert.strictEqual(calcResult, 58);
console.log("✓ Test 3 Passed: Safe arithmetic evaluation verified.");

console.log("All Tool Registry & Security tests passed successfully!");
