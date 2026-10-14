import "dotenv/config"
import { initChatModel } from "langchain"


/**
 * 生成一个Langchain模型实例
 * @param temperature 模型的温度参数，0-1之间，0表示确定，1表示随机
 * @returns  生成的模型实例
 */
export const generateModel = async (temperature = 0)=>{
  const model = await initChatModel(`${process.env.MODEL}`, {
    modelProvider: "openai",
    temperature,
  });
  return model
}



export const smallModel = await initChatModel(`${process.env.SILICONFLOW_MODEL}`, {
  modelProvider: "openai",
  apiKey: process.env.SILICONFLOW_API_KEY,
  temperature: 0,
  configuration: {
    baseURL: process.env.SILICONFLOW_BASE_URL,
  },
});