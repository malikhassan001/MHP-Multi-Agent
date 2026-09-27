export interface MHPProject {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  filesCount: number;
  activeBranch: string;
  tags: string[];
}

class ProjectStore {
  private projects: Map<string, MHPProject> = new Map();

  constructor() {
    this.projects.set("proj_default", {
      id: "proj_default",
      name: "Portfolio & Frontend Workspace",
      description: "Primary sandboxed developer workspace for website generation and fullstack apps.",
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
      filesCount: 3,
      activeBranch: "main",
      tags: ["frontend", "portfolio", "dark-mode"],
    });
  }

  public getAllProjects(): MHPProject[] {
    return Array.from(this.projects.values());
  }

  public getProject(id: string): MHPProject | undefined {
    return this.projects.get(id);
  }

  public createProject(name: string, description: string): MHPProject {
    const id = `proj_${Date.now()}`;
    const project: MHPProject = {
      id,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      filesCount: 0,
      activeBranch: "main",
      tags: ["custom"],
    };
    this.projects.set(id, project);
    return project;
  }

  public deleteProject(id: string): boolean {
    return this.projects.delete(id);
  }
}

export const projectStore = new ProjectStore();
