import { AgentDefinition } from "../types";

export const utilityAgents: AgentDefinition[] = [
  {
    id: "calculator-agent",
    name: "Calculator & Math Agent",
    description: "Performs rigorous mathematical calculations, financial formulas, statistical analysis, and conversions.",
    category: "utility",
    instructions: "Solve formulas step-by-step, verify numeric accuracy, and format outputs cleanly.",
    capabilities: ["math_calculation", "statistics", "unit_conversion"],
    tools: ["calculator"],
    supportedInputs: ["text"],
    supportedOutputs: ["text", "artifact"],
    permissions: ["READ"],
    enabled: true,
    avatarIcon: "Calculator",
  },
  {
    id: "regex-agent",
    name: "Regex & Pattern Agent",
    description: "Engineers, tests, and explains complex regular expressions with edge-case validation.",
    category: "utility",
    instructions: "Create performant regex patterns, explain token match logic, and test against positive/negative cases.",
    capabilities: ["regex_generation", "pattern_matching", "regex_explanation"],
    tools: [],
    supportedInputs: ["text"],
    supportedOutputs: ["text", "code"],
    permissions: ["READ"],
    enabled: true,
    avatarIcon: "Code2",
  }
];
