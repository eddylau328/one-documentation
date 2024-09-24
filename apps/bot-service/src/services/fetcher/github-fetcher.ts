import fs from "fs";
import path from "path";
import { Fetcher } from "../../types/FetchService";
import simpleGit, { SimpleGit } from "simple-git";
import { DataFile } from "../../types/BotService";


export interface GithubProjectFetchServiceConfig {
  repoUrl: string;
}


export class GithubProjectFetchService implements Fetcher {
  /*
    GitHub doesn't directly expose a dedicated API for fetching Wiki pages.
    Instead, Wiki pages are stored as a Git repository.
    Therefore, we can clone the Wiki repository and access the pages from there.  
  */
  private git: SimpleGit;

  constructor(private config: GithubProjectFetchServiceConfig) {
    this.git = simpleGit();
  }

  public async fetchWikiPages(): Promise<DataFile[]> {
    const repoPath = path.resolve(__dirname, `../../../repos/github/${this.config.repoUrl.split(`/`).pop()}`);
    await this.cloneWiki(this.config.repoUrl, repoPath);
    const files = fs.readdirSync(repoPath);
    return files.filter(file => file.endsWith('.md')).map(file => {
        const filePath = path.join(repoPath, file);
        return { file: fs.createReadStream(filePath) };
    });
  }

  private async cloneWiki(repoUrl: string, repoPath: string) {
    if (fs.existsSync(repoPath)) {
      // If repo exists, pull the latest changes
      console.log('Pull latest changes');
      await this.git.cwd(repoPath).pull();
    } else {
      console.log('Clone the wiki repo');
      await this.git.clone(repoUrl, repoPath);
    }
  }
}
