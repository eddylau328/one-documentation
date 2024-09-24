import { randomUUID } from "crypto";
import { DBService, Project, ProjectCreate, ProjectId, ProjectUpdate } from "../../types/DBService";
import { Collection, Db, Document, MongoClient, ServerApiVersion } from "mongodb";

export class MongoService implements DBService {
  private client: MongoClient;
  private db: Db | undefined;
  private collection: Collection | undefined;

  constructor (private connectURI: string, private databaseName: string) {
    this.client = new MongoClient(this.connectURI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
  }

  async setup() {
    await this.client.connect();
    this.db = this.client.db(this.databaseName);
    this.collection = this.db.collection('Project');
  }

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
    await this.collection?.insertOne(project);
    return await this.retrieveProject(project.id);
  }

  async updateProject(projectId: ProjectId, project: ProjectUpdate): Promise<Project> {
    await this.collection?.updateOne({ id: projectId },  { $set: { ...project }});
    return await this.retrieveProject(projectId);
  }

  async retrieveProject(projectId: ProjectId): Promise<Project> {
    const doc = await this.collection?.findOne({ id: projectId });
    if (!doc) throw new Error(`Project ${projectId} not found`);
    return this.transformDocToProject(doc);
  }

  async retrieveProjectList(): Promise<Project[]> {
    return [];
  }

  async retrieveProjectByRepoUrl(findRepoUrl: string): Promise<Project> {
    const doc = await this.collection?.findOne({ repoUrl: findRepoUrl });
    if (!doc) throw new Error(`Project ${findRepoUrl} not found`);
    return this.transformDocToProject(doc);
  }

  private transformDocToProject(doc: Document): Project {
    return {
      id: doc.id,
      repoName: doc.repoName,
      repoUrl: doc.repoUrl,
      repoServiceProvider: doc.repoServiceProvider,
      isEnabled: doc.isEnabled,
      isSynced: doc.isSynced,
      botMeta: doc.botMeta,
      fetchers: doc.fetchers,
    }
  }
}
