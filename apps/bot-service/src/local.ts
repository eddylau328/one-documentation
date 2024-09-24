import { createInterface } from "readline";
import { SubscriptionService } from "./services/subscription";
import { MongoService } from "./services/db";
import { FetchService } from "./services/fetcher";
import { OpenAIService } from "./services/bot-service";
import { CreateProjectRequest } from "./types/SubscriptionService";
import { ProjectDataSourceProvider, RepoServiceProvider } from "./types/Common";
import { Stream, Transform } from "stream";


const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptProjectRepoUrl(): Promise<string> {
    return new Promise((resolve) => {
        rl.question('Enter your repo url: ', repoUrl => {
            resolve(repoUrl);
        })
    });
}

function promptCreateProjectRequest(repoUrl: string): Promise<CreateProjectRequest> {
    return new Promise((resolve) => {
        rl.question('Enter your repo data source url: (github wiki url)', (wikiRepoUrl) => {
                resolve({
                    repoUrl,
                    repoServiceProvider: RepoServiceProvider.GITHUB,
                    fetchers: [
                        {
                            sourceProvider: ProjectDataSourceProvider.GITHUB_WIKI,
                            sourceMeta: {
                                repoUrl: wikiRepoUrl,
                            }
                        }
                    ],
                });
            }
        )
    });
}

function promptQuestion(): Promise<string> {
    return new Promise((resolve) => rl.question('Type your question: (If no other question, type "end")\n', (question) => {
        resolve(question);
    }));
}

function promptDeleteProject(): Promise<string> {
    return new Promise((resolve) => rl.question('Need to remove your project helper bot? Type "yes" if you want to remove: ', (answer) => {
        resolve(answer);
    }));
}

function waitForChatbotAnswer(stream: Stream): Promise<void> {
    return new Promise(function(resolve, reject) {
        stream.pipe(new Transform({
            transform(chunk, encoding, callback) {
                const data = JSON.parse(chunk.toString());
                if (data && data?.type === 'text') {
                    process.stdout.write(data.text.value);
                }
                callback(null, chunk);
            }
        })).on('error', reject).on('finish', resolve);
    })
}

async function main() {
    const dbService = new MongoService(
        process.env.MONGO_DB_URI || '',
        process.env.MONGO_DB_NAME || '',
    );
    await dbService.setup();
    const botService = new OpenAIService(
        process.env.OPENAI_API_KEY || '',
        dbService,
    );
    const fetchService = new FetchService();
    const subscriptionService = new SubscriptionService(dbService, botService, fetchService);

    const repoUrl = await promptProjectRepoUrl();
    let project;
    try {
        project = await subscriptionService.retrieveProject(repoUrl);
        if (!project.botMeta) {
            await botService.createBot(project.id);
        }
        console.log(`-------------------------------------`)
        console.log(`Chatbot is found for ${project.id}...`);
        console.log(`-------------------------------------`)
        console.log(`Update wiki if needed`);
        await subscriptionService.updateDataSource(project.id);
        await subscriptionService.enableBot(project.id);
    } catch {
        let projectRequest = await promptCreateProjectRequest(repoUrl);
        console.log(`-------------------------------------`)
        console.log(`Chatbot is setting up...`);
        project = await subscriptionService.createProject(projectRequest);
        await subscriptionService.enableBot(project.id);
    }

    console.log(`-------------------------------------`)
    console.log(`Chatbot finished loading, here is the data:`);
    project = await dbService.retrieveProject(project.id);
    console.log(JSON.stringify(project));

    const chatRoomResponse = await botService.createChat(project.id);
    console.log(`-------------------------------------`)
    console.log(`Chatbot detail: ${JSON.stringify(chatRoomResponse)}`);
    console.log(`-------------------------------------`)

    let question;
    do {
        question = await promptQuestion();
        console.log();
        const messageRequest = {
            content: question,
            ...chatRoomResponse,
        }
        const stream = await botService.sendMessageStream(messageRequest)
        await waitForChatbotAnswer(stream);
        console.log();
    } while (question !== 'end');

    await botService.deleteChat(chatRoomResponse.threadId);
    console.log(`-------------------------------------`)
    console.log(`Finish chatting, thread ${chatRoomResponse.threadId} is removed!`);
    console.log(`-------------------------------------`)

    rl.close();
}

main();
