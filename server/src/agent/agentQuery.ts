import "dotenv/config"
import { createAgent,initChatModel } from "langchain";
import { getPetData,getPetEvolution,getGameStats,getPetChart,getSkillEffect,getSkillData,getBaiduBaike_roco,getPetsBySkill,getPetInfo } from "../tools/rocoTools";
import toolsError from "../middleware/toolsError.js";
import { systemPromptQuery } from "../prompts/systemPrompt.js";


const model = await initChatModel(`${process.env.MODEL}`, {
  modelProvider: "openai",
  temperature: 0,
});


//查询agent
export const agentQuery = createAgent({
  name:"agentQuery",
  model,
  tools: [getPetData,getPetEvolution,getGameStats,getPetChart,getSkillEffect,getSkillData,getBaiduBaike_roco,getPetsBySkill,getPetInfo],
  middleware: [toolsError],
  systemPrompt:systemPromptQuery
});
