import { ProjectDataSourceProvider, RepoServiceProvider } from "./Common";

export type ProjectId = string;
export type ProjectFetcherId = string;



export interface Project {
  id: ProjectId;
  repoName: string;
  repoUrl: string;
  repoServiceProvider: RepoServiceProvider;
  isEnabled: boolean;
  isSynced: boolean;
  botMeta: BotMeta | null;
  fetchers: ProjectFetcher[] | null;
}

export interface BotMeta {
  openAIAssistantId?: string;
  openAIVectorStoreId?: string;
}


export interface ProjectCreate {
  id?: ProjectId;
  repoName: string;
  repoUrl: string;
  isEnabled: boolean;
  isSynced: boolean;
  botMeta: BotMeta | null;
  repoServiceProvider: RepoServiceProvider;
  fetchers: ProjectFetcherCreate[];
}

export interface ProjectUpdate {
  isEnabled?: boolean;
  isSynced?: boolean;
  botMeta?: BotMeta | null;
}

export interface ProjectFetcher {
  id: ProjectFetcherId;
  sourceProvider: ProjectDataSourceProvider;
  sourceMeta: Object;
}

export interface ProjectFetcherCreate {
  id?: ProjectFetcherId;
  sourceProvider: ProjectDataSourceProvider;
  sourceMeta: Object;
}

export interface DBService {
  setup(): Promise<void>
  createProject(project: ProjectCreate): Promise<Project>;
  updateProject(projectId: ProjectId, project: ProjectUpdate): Promise<Project>;
  retrieveProjectList(): Promise<Project[]>;
  retrieveProject(projectId: ProjectId): Promise<Project>;
  retrieveProjectByRepoUrl(repoUrl: string): Promise<Project>;
}
