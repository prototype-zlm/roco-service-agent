import "dotenv/config"
import { createAgent,initChatModel } from "langchain";
import { getPetChart,getSkillEffect,getSkillData,getBattleRules,getPetsBySkill,getPetInfo } from "../tools/rocoTools";
import toolsError from "../middleware/toolsError.js";
import { systemPromptBattle } from "../prompts/systemPrompt.js";




const model = await initChatModel(`${process.env.MODEL}`, {
  modelProvider: "openai",
  temperature: 0,
});


//战斗agent
export const agentBattle = createAgent({
  name:"agentBattle",
  model,
  tools: [getPetChart,getSkillEffect,getSkillData,getBattleRules,getPetsBySkill,getPetInfo],
  middleware: [toolsError],
  systemPrompt:systemPromptBattle,
});
