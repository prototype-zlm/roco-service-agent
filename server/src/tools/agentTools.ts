import { agentQuery } from "../agent/agentQuery";
import { agentBattle } from "../agent/agentBattle";
import { agentTeam } from "../agent/agentTeam";
import { tool } from "langchain";
import * as z from "zod";
import { getMessageText } from "../utils/getMessageText";

export const callBattleAgent = tool(
  async ({ question }) => {
    console.log("战斗机制agent被调用了");
    const result = await agentBattle.invoke({
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });
    const last = result.messages.at(-1);
    const content = last ? getMessageText(last) : "";

    if (!content) {
      return {
        success: false,
        error: {
          message: "根据我的知识，我无法回答这个问题。",
          tool: "战斗机制",
        },
      };
    }
    return {
      success: true,
      data: {
        content: content,
        tool: "战斗机制",
      },
    };
  },
  {
    name: "战斗机制",
    description:
      "战斗机制agent，负责伤害与数值计算、克制推演、印记 / 异常状态 / 觉醒 / 特性 / 天气等机制解释、对战策略",
    schema: z.object({
      question: z.string().describe("需要委托的战斗机制问题"),
    }),
  },
);
export const callQueryAgent = tool(
  async ({ question }) => {
    console.log("图鉴查询agent被调用了");
    const result = await agentQuery.invoke({
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });
    const last = result.messages.at(-1);
    const content = last ? getMessageText(last) : "";

    if (!content) {
      return {
        success: false,
        error: {
          message: "根据我的知识，我无法回答这个问题。",
          tool: "图鉴查询",
        },
      };
    }
    return {
      success: true,
      data: {
        content: content,
        tool: "图鉴查询",
      },
    };
  },
  {
    name: "图鉴查询",
    description:
      "图鉴查询agent，负责精灵资料、种族值、技能效果、进化链、属性克制倍率、图鉴统计，以及游戏背景 / 角色 / 道具 / 地图等事实性查询",
    schema: z.object({
      question: z.string().describe("需要委托的图鉴查询问题"),
    }),
  },
);
export const callTeamAgent = tool(
  async ({ question }) => {
    console.log("配队推荐agent被调用了");
    const result = await agentTeam.invoke({
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });
    const last = result.messages.at(-1);
    const content = last ? getMessageText(last) : "";

    if (!content) {
      return {
        success: false,
        error: {
          message: "根据我的知识，我无法回答这个问题。",
          tool: "配队推荐",
        },
      };
    }
    return {
      success: true,
      data: {
        content: content,
        tool: "配队推荐",
      },
    };
  },
  {
    name: "配队推荐",
    description: "配队推荐agent，负责阵容搭配、属性覆盖分析、配招建议",
    schema: z.object({
      question: z.string().describe("需要委托的队伍推荐问题"),
    }),
  },
);
