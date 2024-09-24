import { BotService, ChatResponse, DataFile, MessageRequest, MessageResponse } from "../types/BotService";
import OpenAI from "openai";
import { BotMeta, DBService, ProjectId } from "../types/DBService";
import { PassThrough, Stream } from "stream";

export class OpenAIService implements BotService {
  private client: OpenAI;

  constructor(apiKey: string, private db: DBService) {
    this.client = new OpenAI({ apiKey });
  }

  async createBot(projectId: ProjectId): Promise<void> {
    const { repoName, repoUrl, botMeta } = await this.db.retrieveProject(projectId);
    if (botMeta) throw new Error(`Bot for Project ${projectId} already created`);
    const vectoreStore = await this.client.beta.vectorStores.create({
      name: `${repoUrl}-vectore-store`,
    });
    const newBotMeta: BotMeta = {}
    newBotMeta.openAIVectorStoreId = vectoreStore.id;
    const assistant = await this.client.beta.assistants.create({
      name: `${repoName} Helper`,
      model: 'gpt-4o-mini',
      tools: [{'type': 'file_search'}],
      instructions: `You are a knowledge owner of the project. Use your knowledge base to answer questions about the project. If you don't know the answer, just say that \"I don't know\", don't try to make up an answer.`,
      tool_resources: {"file_search": {"vector_store_ids": [vectoreStore.id]}},
    });
    newBotMeta.openAIAssistantId = assistant.id;
    await this.db.updateProject(projectId, { isEnabled: false, isSynced: false, botMeta: newBotMeta });
  }

  async removeBot(projectId: ProjectId): Promise<void> {
    const { botMeta } = await this.db.retrieveProject(projectId);
    if (!botMeta) return;
    if (botMeta.openAIAssistantId) await this.client.beta.assistants.del(botMeta.openAIAssistantId);
    if (botMeta.openAIVectorStoreId) await this.client.beta.vectorStores.del(botMeta.openAIVectorStoreId);
    await this.db.updateProject(projectId, { isEnabled: false, isSynced: false, botMeta: null });
  }

  async uploadDataSource(projectId: ProjectId, files: DataFile[]): Promise<void> {
    const { botMeta } = await this.db.retrieveProject(projectId);
    if (!botMeta || !botMeta?.openAIVectorStoreId) throw new Error(`Bot for Porject ${projectId} not properly initialized`);
    for (const { file } of files) {
      await this.client.beta.vectorStores.files.uploadAndPoll(botMeta.openAIVectorStoreId, file);
    }
  }

  async createChat(projectId: string): Promise<ChatResponse> {
    const { botMeta } = await this.db.retrieveProject(projectId);
    if (!botMeta?.openAIVectorStoreId || !botMeta?.openAIAssistantId)
      throw new Error(`Project ${projectId} BotMeta essential fields not found`)
    const assistant = await this.client.beta.assistants.retrieve(
      botMeta.openAIAssistantId,
    )
    const thread = await this.client.beta.threads.create({
      tool_resources: {
        file_search: {
          vector_store_ids: [botMeta.openAIVectorStoreId],
        }
      },
    });
    return { assistantId: assistant.id, threadId: thread.id };
  }

  async sendMessage(messageRequest: MessageRequest): Promise<MessageResponse> {
    await this.client.beta.threads.messages.create(
      messageRequest.threadId,
      { role: 'user', content: messageRequest.content },
    )
    const stream = await this.client.beta.threads.runs.create(
      messageRequest.threadId,
      { assistant_id: messageRequest.assistantId, stream: true },
    )
    for await (const event of stream) {}
    const messages = await this.client.beta.threads.messages.list(
      messageRequest.threadId,
      { limit: 1, order: 'desc' },
    );
    const latestMessage = messages.data[0]
    return {
      content: latestMessage.content[0],
      role: latestMessage.role,
      createdAt: new Date(latestMessage.created_at)
    } 
  }

  async sendMessageStream(messageRequest: MessageRequest): Promise<Stream> {
    await this.client.beta.threads.messages.create(
      messageRequest.threadId,
      { role: 'user', content: messageRequest.content },
    )
    const stream = await this.client.beta.threads.runs.create(
      messageRequest.threadId,
      { assistant_id: messageRequest.assistantId, stream: true },
    )
    return await this.handleOpenAIStream(stream);
  }

  async deleteChat(threadId: string): Promise<void> {
    await this.client.beta.threads.del(threadId);
  }

  // Function to handle OpenAI stream and send it through the transform stream
  private async handleOpenAIStream(response: any): Promise<Stream> {
    // Create a PassThrough stream for sending modified data
    const passThrough = new PassThrough();

    // Asynchronously process the OpenAI response and send data to the PassThrough stream
    (async () => {
      try {
        for await (const event of response) {
          if (event.event === 'thread.message.delta') {
            passThrough.write(JSON.stringify(event.data.delta.content[0])); // Write the content to the stream
          }
        }
      } catch (error) {
        console.error('Error during streaming:', error);
      } finally {
        passThrough.end();
      }
    })();
    // Return the PassThrough stream, which will be piped later
    return passThrough;
  }
}
