import { Application } from "express";
import { Controller } from "../types/Controller";
import { Request, Response, NextFunction } from "express";
import { BotService } from "../types/BotService";

export class BotController implements Controller {
  constructor(private baseRoute: string, private botService: BotService) {}

  public init(app: Application): void {
    app.post(`${this.baseRoute}/create`, this.create.bind(this));
    app.post(`${this.baseRoute}/ask`, this.ask.bind(this));
    app.delete(`${this.baseRoute}/chat/:id`, this.delete.bind(this));
  }

  private async create(req: Request, res: Response, next: NextFunction) {
    const projectId = req.body?.projectId || '';
    const chatRoomRepsonse = await this.botService.createChat(projectId);
    res.json(chatRoomRepsonse);
  }

  private async ask(req: Request, res: Response, next: NextFunction) {
    const content = req.body?.content || '';
    const assistantId = req.body?.assistantId || '';
    const threadId = req.body?.threadId || '';
    const messageResponse = await this.botService.sendMessage({ content, assistantId, threadId })
    res.json(messageResponse);
  }

  private async delete(req: Request, res: Response, next: NextFunction) {
    const threadId = req.params.id;
    await this.botService.deleteChat(threadId);
    res.json();
  }
}
