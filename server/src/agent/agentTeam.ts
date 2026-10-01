import "dotenv/config"
import { createAgent,initChatModel } from "langchain";
import { getPetChart,getSkillEffect,getBattleRules,team_system_analysis,analyzeTeamCoverage,searchPets,getPetsBySkill,getPetInfo } from "../tools/rocoTools";
import toolsError from "../middleware/toolsError.js";
import { systemPromptTeam } from "../prompts/systemPrompt.js";



const model = await initChatModel(`${process.env.MODEL}`, {
  modelProvider: "openai",
  temperature: 0,
});


//配队agent
export const agentTeam = createAgent({
  name:"agentTeam",
  model,
  tools: [getPetChart,getSkillEffect,getBattleRules,team_system_analysis,analyzeTeamCoverage,searchPets,getPetsBySkill,getPetInfo],
  middleware: [toolsError],
  systemPrompt: systemPromptTeam,
});
