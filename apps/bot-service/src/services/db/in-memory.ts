import { randomUUID } from "crypto";
import { DBService, Project, ProjectCreate, ProjectId, ProjectUpdate } from "../../types/DBService";

export class InMemoryService implements DBService {
  public store: Project[] = [];

  async setup() {}

  async createProject(newProject: ProjectCreate): Promise<Project> {
    const project: Project = {
      id: randomUUID().toString(),
      repoName: newProject.repoName,
      repoUrl: newProject.repoUrl,
      repoServiceProvider: newProject.repoServiceProvider,
      isEnabled: newProject.isEnabled,
      isSynced: newProject.isSynced,
      botMeta: newProject.botMeta,
      fetchers: newProject.fetchers.map(({ sourceMeta, sourceProvider }) => ({
        id: randomUUID().toString(),
        sourceMeta,
        sourceProvider,
      })),
    }
    this.store.push(project);
    return Promise.resolve(project);
  }

  async updateProject(projectId: ProjectId, project: ProjectUpdate): Promise<Project> {
    const updateIndex = this.store.findIndex(({id}) => id === projectId);
    this.store[updateIndex] = { ...this.store[updateIndex], ...project };
    return this.store[updateIndex];
  }

  async retrieveProject(projectId: ProjectId): Promise<Project> {
    const project = this.store.find(({id}) => id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    return Promise.resolve(project);
  }

  async retrieveProjectList(): Promise<Project[]> {
    return Promise.resolve(this.store);     
  }

  async retrieveProjectByRepoUrl(findRepoUrl: string): Promise<Project> {
    const project = this.store.find(({repoUrl}) => repoUrl === findRepoUrl);
    if (!project) throw new Error(`Project ${findRepoUrl} not found`);
    return Promise.resolve(project);
  }
}
