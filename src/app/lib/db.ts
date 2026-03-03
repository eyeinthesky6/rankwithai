
import { SuggestBrandMemoryOutput } from "@/ai/flows/suggest-brand-memory-flow";
import { GenerateFeedPagesOutput } from "@/ai/flows/generate-feed-pages";

export interface PageHistory {
  timestamp: string;
  seoTitle: string;
  metaDescription: string;
  faqs: any[];
  reason: string;
}

export interface RefreshLog {
  id: string;
  projectId: string;
  timestamp: string;
  pageSlug: string;
  ruleTriggered: string;
  metricValue: string;
  actionTaken: string;
}

export interface ProjectPage extends any {
  slug: string;
  history?: PageHistory[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  website: string;
  niche: string;
  createdAt: number;
  brandMemory?: SuggestBrandMemoryOutput;
  pages?: ProjectPage[];
  refreshLogs?: RefreshLog[];
}

class MockDB {
  private projects: Map<string, Project> = new Map();

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    return Array.from(this.projects.values()).find(p => p.slug === slug);
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'slug'>): Promise<Project> {
    const id = Math.random().toString(36).substring(2, 9);
    const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newProject: Project = {
      ...project,
      id,
      slug,
      createdAt: Date.now(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) throw new Error("Project not found");
    const updated = { ...project, ...updates };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<void> {
    this.projects.delete(id);
  }
}

const globalForDb = global as unknown as { db: MockDB };
export const db = globalForDb.db || new MockDB();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
