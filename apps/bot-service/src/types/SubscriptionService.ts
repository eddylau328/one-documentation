import { ProjectDataSourceProvider, RepoServiceProvider } from "./Common";
import { Project, ProjectId } from "./DBService"


export interface CreateProjectRequest {
  repoUrl: string;
  repoServiceProvider: RepoServiceProvider;
  fetchers: [
    {
      sourceProvider: ProjectDataSourceProvider;
      sourceMeta: Object;
    }
  ]
}

export interface SubscriptionService {
  createProject(createProjectRequest: CreateProjectRequest): Promise<Project>;
  enableBot(projectId: ProjectId): Promise<void>
  disableBot(projectId: ProjectId): Promise<void>
  updateDataSource(projectId: ProjectId): Promise<void>
}
