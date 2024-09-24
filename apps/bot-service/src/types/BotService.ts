import { MessageContent } from "openai/resources/beta/threads/messages";
import { ProjectId } from "./DBService";
import { Uploadable } from "openai/uploads";

export interface MessageResponse {
  content: MessageContent;
  role: string;
  createdAt: Date;
}

export interface MessageChunkResponse {
  content: MessageContent;
}

export interface MessageRequest {
  content: string;
  threadId: string;
  assistantId: string;
}

export interface ChatResponse {
  assistantId: string;
  threadId: string;
}

export interface DataFile {
  file: Uploadable;
}

export interface BotService {
  createBot(projectId: ProjectId): Promise<void>;
  removeBot(projectId: ProjectId): Promise<void>;
  uploadDataSource(projectId: ProjectId, files: DataFile[]): Promise<void>;
  createChat(projectId: ProjectId): Promise<ChatResponse>;
  sendMessage(messageRequest: MessageRequest): Promise<MessageResponse>;
  deleteChat(threadId: string): Promise<void>;
}
