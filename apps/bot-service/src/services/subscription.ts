import { BotService } from "../types/BotService";
import { DBService, Project, ProjectId } from "../types/DBService";
import { FetchService } from "../types/FetchService";
import { CreateProjectRequest, SubscriptionService as ISubscriptionService } from "../types/SubscriptionService";

export class SubscriptionService implements ISubscriptionService {
  constructor(
    private dbService: DBService,
    private botService: BotService,
    private fetchService: FetchService,
  ) {}

  public async createProject(createProjectRequest: CreateProjectRequest): Promise<Project> {
    const project = await this.dbService.createProject({
      repoName: createProjectRequest.repoUrl.split('/').pop() || createProjectRequest.repoUrl,
      repoUrl: createProjectRequest.repoUrl,
      repoServiceProvider: createProjectRequest.repoServiceProvider,
      fetchers: createProjectRequest.fetchers,
      isEnabled: false,
      isSynced: false,
      botMeta: null,
    });
    await this.botService.createBot(project.id);
    return project;
  }

  public async retrieveProject(repoUrl: string): Promise<Project> {
    const project = await this.dbService.retrieveProjectByRepoUrl(repoUrl);
    return project;
  }

  public async enableBot(projectId: ProjectId) {
    await this.updateDataSource(projectId);
    await this.dbService.updateProject(projectId, { isEnabled: true });
  }

  public async disableBot(projectId: ProjectId) {
    await this.dbService.updateProject(projectId, { isEnabled: false });
  }

  public async updateDataSource(projectId: ProjectId) {
    const { fetchers } = await this.dbService.retrieveProject(projectId);
    fetchers?.map(async (source) => {
      const fetcher = this.fetchService.getFetcher(source);
      const pages = await fetcher.fetchWikiPages();
      await this.botService.uploadDataSource(projectId, pages);
    });
    await this.dbService.updateProject(projectId, { isSynced: true });
  }
}
