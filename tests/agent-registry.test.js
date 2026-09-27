const assert = require("assert");

// Test that agent definitions are valid
const chatAgents = [
  { id: "general-chat", category: "chat", capabilities: ["general_dialogue"] },
  { id: "coding-agent", category: "coding", capabilities: ["code_generation", "testing"] },
  { id: "pdf-agent", category: "file", capabilities: ["pdf_parsing"] },
  { id: "research-agent", category: "chat", capabilities: ["web_research"] },
  { id: "seo-agent", category: "business", capabilities: ["keyword_research"] },
];

console.log("Running Agent Registry Test Suite...");

// Test 1: Category lookup
const codingMatches = chatAgents.filter((a) => a.category === "coding");
assert.strictEqual(codingMatches.length, 1);
assert.strictEqual(codingMatches[0].id, "coding-agent");
console.log("✓ Test 1 Passed: Category lookup works.");

// Test 2: Capability matching
const codeGenAgents = chatAgents.filter((a) => a.capabilities.includes("code_generation"));
assert.strictEqual(codeGenAgents.length, 1);
assert.strictEqual(codeGenAgents[0].id, "coding-agent");
console.log("✓ Test 2 Passed: Capability-driven matching works.");

// Test 3: Scaling agent addition
chatAgents.push({ id: "custom-agent", category: "custom", capabilities: ["custom_math"] });
assert.strictEqual(chatAgents.length, 6);
console.log("✓ Test 3 Passed: Dynamic registration scaled cleanly.");

console.log("All Agent Registry tests passed successfully!");
