import * as dotenv from "dotenv";
import express from "express";
import { BotController } from "./controllers/bot-controller";
import { OpenAIService } from "./services/bot-service";
import { InMemoryService } from "./services/db";

dotenv.config();

const app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const dbService = new InMemoryService();
const botService = new OpenAIService(process.env.OPENAI_API_KEY || '', dbService);
const botController = new BotController('/bot', botService);
botController.init(app);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening to port ${process.env.PORT || 3000}`) ;
});
