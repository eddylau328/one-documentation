import express from "express"

export interface Controller {
  init(app: express.Application, baseRoute: string): void;
}
