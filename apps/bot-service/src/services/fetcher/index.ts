import { ProjectDataSourceProvider } from "../../types/Common";
import { ProjectFetcher } from "../../types/DBService";
import { Fetcher, FetchService as IFetchService } from "../../types/FetchService";
import { GithubProjectFetchService, GithubProjectFetchServiceConfig } from "./github-fetcher";

export class FetchService implements IFetchService {
  getFetcher(source: ProjectFetcher): Fetcher {
    if (source.sourceProvider === ProjectDataSourceProvider.GITHUB_WIKI) {
      return new GithubProjectFetchService(source.sourceMeta as GithubProjectFetchServiceConfig);
    }
    throw new Error(`Not supporting ${source.sourceProvider}`);
  }
}
