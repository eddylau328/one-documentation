import { DataFile } from "./BotService";
import { ProjectFetcher } from "./DBService";

export interface Fetcher {
  fetchWikiPages(): Promise<DataFile[]>;
}

export interface FetchService {
  getFetcher(source: ProjectFetcher): Fetcher;
}