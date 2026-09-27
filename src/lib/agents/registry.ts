import { AgentDefinition, AgentCategory } from "./types";
import { chatAgents } from "./catalog/chat-agents";
import { codingAgents } from "./catalog/coding-agents";
import { webAgents } from "./catalog/web-agents";
import { fileAgents } from "./catalog/file-agents";
import { creativeAgents } from "./catalog/creative-agents";
import { audioAgents } from "./catalog/audio-agents";
import { videoAgents } from "./catalog/video-agents";
import { businessAgents } from "./catalog/business-agents";
import { utilityAgents } from "./catalog/utility-agents";

class UniversalAgentRegistry {
  private agents: Map<string, AgentDefinition> = new Map();
  private customAgents: Map<string, AgentDefinition> = new Map();

  constructor() {
    this.registerBuiltins([
      ...chatAgents,
      ...codingAgents,
      ...webAgents,
      ...fileAgents,
      ...creativeAgents,
      ...audioAgents,
      ...videoAgents,
      ...businessAgents,
      ...utilityAgents,
    ]);
  }

  private registerBuiltins(agents: AgentDefinition[]) {
    for (const agent of agents) {
      this.agents.set(agent.id, agent);
    }
  }

  public registerAgent(agent: AgentDefinition, isCustom = false): void {
    if (isCustom) {
      this.customAgents.set(agent.id, { ...agent, isCustom: true });
    } else {
      this.agents.set(agent.id, agent);
    }
  }

  public getAgent(id: string): AgentDefinition | undefined {
    return this.customAgents.get(id) || this.agents.get(id);
  }

  public getAllAgents(): AgentDefinition[] {
    return [
      ...Array.from(this.agents.values()),
      ...Array.from(this.customAgents.values()),
    ];
  }

  public getAgentsByCategory(category: AgentCategory): AgentDefinition[] {
    return this.getAllAgents().filter((a) => a.category === category);
  }

  public findAgentsByCapabilities(requiredCapabilities: string[]): AgentDefinition[] {
    return this.getAllAgents().filter((agent) => {
      if (!agent.enabled) return false;
      return requiredCapabilities.some((cap) =>
        agent.capabilities.includes(cap)
      );
    });
  }

  public findBestAgent(capability: string): AgentDefinition | undefined {
    const matches = this.getAllAgents().filter(
      (a) => a.enabled && a.capabilities.includes(capability)
    );
    return matches[0];
  }

  public toggleAgent(id: string, enabled: boolean): boolean {
    const agent = this.getAgent(id);
    if (!agent) return false;
    agent.enabled = enabled;
    return true;
  }

  public deleteCustomAgent(id: string): boolean {
    return this.customAgents.delete(id);
  }
}

export const agentRegistry = new UniversalAgentRegistry();
