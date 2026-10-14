import { fileURLToPath } from "node:url";
import { createAgent } from "langchain";
import { callBattleAgent,callQueryAgent,callTeamAgent } from "../tools/agentTools";
import toolsError from "../middleware/toolsError.js";
import contextRatio from "../middleware/compressContext.js";
import guardrails from "../middleware/guardrails.js"
import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
import { systemPromptMain } from "../prompts/systemPrompt.js";
import { generateModel } from "../models/index.js";

const model = await generateModel(0.3);


export const checkpointer = SqliteSaver.fromConnString(
  fileURLToPath(new URL("../../checkpoints.sqlite", import.meta.url))
);



//主agent
export const agentMain = createAgent({
  name:"agentMain",
  model,
  tools: [callBattleAgent,callQueryAgent,callTeamAgent],
  middleware: [toolsError,contextRatio,guardrails],
  systemPrompt:systemPromptMain,
  checkpointer,
});
