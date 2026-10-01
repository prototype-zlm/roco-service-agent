import "dotenv/config";
import {
  createMiddleware,
  HumanMessage,
} from "langchain";
import { RemoveMessage } from "@langchain/core/messages";
import { getMessageText } from "../utils/getMessageText"


const desensitize = (text: string) => {
  const sensitivePatterns = {
    phoneNumber: /\b1[3-9]\d{9}\b/g, // 中国大陆手机号
    idCard: /\b\d{17}[\dXx]\b/g, // 身份证号
    creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, // 信用卡号
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // 邮箱
    openAIToken: /\bsk-[a-zA-Z0-9]{20,}\b/g, // OpenAI API Key
    awsAccessKey: /\bAKIA[0-9A-Z]{16}\b/g, // AWS Access Key
    githubToken: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g, // GitHub Token
    jwtToken: /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g, // JWT
    ipv4Address: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, // IPv4
    passportCN: /\b[EeGg]\d{8}\b/g, // 中国护照号 (E/G开头加8位数字)
    chinaPlate: /[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z](?:[0-9]{5}[A-HJ-NP-Z]|[A-HJ-NP-Z](?:[A-HJ-NP-Z0-9])[0-9]{4})/g, // 中国车牌号
    dbConnectionString: /\b(?:mongodb|mysql|redis|postgresql):\/\/[^\s]+/g, // 数据库连接串
  };

  const found: { type: string; value: string }[] = [];
  let masked = text;

  // 检测并替换
  for (const [type, pattern] of Object.entries(sensitivePatterns)) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches.map((m) => ({ type, value: m })));
      masked = masked.replace(pattern, "[已脱敏]");
    }
  }

  return { masked, found };
};

const guardrails = createMiddleware({
  name: "guardrails",
  beforeModel: async (state, runtime) => {
    const userMessage = state.messages.filter(
      (item) => item instanceof HumanMessage,
    );
    const lastUserMessage = userMessage.at(-1);

    if (!lastUserMessage) {
      return state;
    }

    const lastUserMessageContent = getMessageText(lastUserMessage);

    const { masked, found } = desensitize(lastUserMessageContent);

    if (found.length > 0) {
      console.warn(`检测到${found.length}条敏感信息,已脱敏,敏感信息如下：`);
      console.dir(found,{depth:null,color:true})
    }
    //没有脱敏的信息，就不用再处理了，直接返回
    if (masked === lastUserMessageContent) {
      return state;
    }

    return {
      messages: [
        new RemoveMessage({
          id: lastUserMessage?.id!,
        }),
        new HumanMessage({
          content: masked,
          id: lastUserMessage?.id!,
        }),
      ],
    };
  }
});


export default guardrails