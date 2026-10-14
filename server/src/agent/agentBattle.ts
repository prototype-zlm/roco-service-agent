import { createAgent } from "langchain";
import { getPetChart,getSkillEffect,getSkillData,getBattleRules,getPetsBySkill,getPetInfo } from "../tools/rocoTools";
import toolsError from "../middleware/toolsError.js";
import { systemPromptBattle } from "../prompts/systemPrompt.js";
import { generateModel } from "../models/index.js";

const model = await generateModel(0);



//战斗agent
export const agentBattle = createAgent({
  name:"agentBattle",
  model,
  tools: [getPetChart,getSkillEffect,getSkillData,getBattleRules,getPetsBySkill,getPetInfo],
  middleware: [toolsError],
  systemPrompt:systemPromptBattle,
});
