import "dotenv/config"
import { initChatModel } from "langchain"

export const smallModel = await initChatModel(`${process.env.SILICONFLOW_MODEL}`, {
  modelProvider: "openai",
  apiKey: process.env.SILICONFLOW_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.SILICONFLOW_BASE_URL,
  },
});