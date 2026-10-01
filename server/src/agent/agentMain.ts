import "dotenv/config"
import { fileURLToPath } from "node:url";
import { createAgent,initChatModel } from "langchain";
import { callBattleAgent,callQueryAgent,callTeamAgent } from "../tools/agentTools";
import toolsError from "../middleware/toolsError.js";
import contextRatio from "../middleware/compressContext.js";
import guardrails from "../middleware/guardrails.js"
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { systemPromptMain } from "../prompts/systemPrompt.js";



export const checkpointer = SqliteSaver.fromConnString(
  fileURLToPath(new URL("../../checkpoints.sqlite", import.meta.url))
);


const model = await initChatModel(`${process.env.MODEL}`, {
  modelProvider: "openai",
  temperature: 0.3,
});


//主agent
export const agentMain = createAgent({
  name:"agentMain",
  model,
  tools: [callBattleAgent,callQueryAgent,callTeamAgent],
  middleware: [toolsError,contextRatio,guardrails],
  systemPrompt:systemPromptMain,
  checkpointer,
});
