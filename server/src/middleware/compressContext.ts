import "dotenv/config";
import { createMiddleware,BaseMessage,SystemMessage,AIMessage,HumanMessage,ToolMessage} from "langchain";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { REMOVE_ALL_MESSAGES } from "@langchain/langgraph"
import { RemoveMessage } from "@langchain/core/messages"; 
import { getMessageText } from "../utils/getMessageText";
import { estimateMessageTokens,truncateByTokens,countTokens } from "../utils/messageToken"
import { AppError } from "../utils/AppError";
import { systemPromptMain } from "../prompts/systemPrompt"
import { smallModel } from "../models"


//对话压缩模型


const chatPrompt = ChatPromptTemplate.fromMessages([
    {role:"system",content:`
      你是一个上下文压缩助手，你负责将提供给你的对话信息压缩成不超过200字的概要
      
      以下是你要压缩的对话信息：
      {beforMessage}
    `}
])

const chain = chatPrompt.pipe(smallModel)


const SYSTEM_TOKENS = countTokens(systemPromptMain)   // 计算系统提示词的 token 数
const BUDGET_LIMIT = 100000; // 模型最大上下文
const COMPRESS_LIMIT = BUDGET_LIMIT * 0.8 - SYSTEM_TOKENS    // 压缩触发线,留20%


//只替换正文，保留消息类型和配对所需的字段
//AIMessage 的 tool_calls 丢了，后面的 ToolMessage 就成了孤儿，provider 会直接 400
const rebuildMessage = (message:BaseMessage,content:string)=>{
  if(message instanceof ToolMessage){
    return new ToolMessage({content,tool_call_id:message.tool_call_id,name:message.name})
  }
  if(message instanceof AIMessage){
    return new AIMessage({content,tool_calls:message.tool_calls})
  }
  return new HumanMessage({content})
}



//压缩上下文
/**
 * 
 * @param messages 要压缩的消息列表
 * @param COMPRESS_LIMIT  上下文压缩边界，超过这个值，触发压缩
 * @param lastMessageCount  保留几条最新消息
 * @returns 
 */
const compressContext = async (messages:BaseMessage[],COMPRESS_LIMIT:number,lastMessageCount:number)=>{
    //保留最新的10条消息
    let lastMessages = []
    //提取早期信息
    let beforMessage = []

     lastMessages = messages.slice(-lastMessageCount)

     //如果切割点落在了AIMessage(tool_calls) 和 ToolMessage之间，那么需要剔除孤儿 ToolMessage
     while (lastMessages[0] instanceof ToolMessage) {
      lastMessages.shift();
    }

     beforMessage = messages.slice(0,-lastMessageCount).map((item)=>{
       if(item instanceof HumanMessage){
         return {role:"user",content:getMessageText(item)}
       }
       if(item instanceof AIMessage){
         return {role:"assistant",content:getMessageText(item)}
       }
       if(item instanceof ToolMessage){
         return {role:"tool",content:getMessageText(item)}
       }
       if(item instanceof SystemMessage){
         return {role:"system",content:item.content}
       }
       return item

     })

    const compressBeforMessage = await chain.invoke({
        beforMessage
     })

    //  包装一下

    let summaryMessage  = new SystemMessage({
      content:`以下是早期信息压缩后的概要：${compressBeforMessage.content}`,
      name:"context-summary"
    })

    const newContext = [summaryMessage,...lastMessages]

    //如果压缩完成之后，上下文仍然超标，怎么办？

    //计算压缩后的token
    const estimatedTokens = estimateMessageTokens(newContext)

    if(estimatedTokens >= COMPRESS_LIMIT){

      //还能继续折半，就少留几条最新消息再压一轮
      if(lastMessageCount > 1){
        return await compressContext(newContext,COMPRESS_LIMIT,Math.ceil(lastMessageCount/2))
      }

      //只剩「摘要 + 最后一条」还超标。摘要被限定在 200 字，问题必然在这一条上
      const lastMessage = lastMessages[0]

      //孤儿 ToolMessage 被剔干净了，只剩摘要，不可能超标
      if(!lastMessage){
        return newContext
      }

      //最后这条消息最多还能够占用多少token
      const allowedTokens = COMPRESS_LIMIT - estimateMessageTokens([summaryMessage])

      //摘要自己就把预算吃满了，说明压缩模型没按 200 字的要求输出
      if(allowedTokens <= 0){
        throw new AppError("上下文压缩失败，摘要超出预算，请尝试创建新的对话",500)
      }

      const truncated = truncateByTokens(getMessageText(lastMessage),allowedTokens)

      console.log(
      `最后一条消息 ${countTokens(getMessageText(lastMessage))} token ，但可用额度只有 ${allowedTokens} token，已截断至 ${countTokens(truncated)} token`
    )

      return [summaryMessage,rebuildMessage(lastMessage,truncated)]
    }


    return newContext
}


const contextRatio = createMiddleware({
  name: "contextRatio",
  beforeModel: async (state, runtime) => {
    const estimatedTokens = estimateMessageTokens(state.messages);


    console.log(
      `[Token Budget] 消息 ${(estimatedTokens/1000).toFixed(2)}K + 固定 ${(SYSTEM_TOKENS/1000).toFixed(2)}K` +
      ` / 触发线 ${(COMPRESS_LIMIT/1000).toFixed(2)}K（上限 ${BUDGET_LIMIT/1000}K）`
    );

    if(estimatedTokens < COMPRESS_LIMIT){
      //上下文还没有到80%，还够用
      return state;
    }

    //执行压缩
    const compressedMessages = await compressContext(state.messages,COMPRESS_LIMIT,10)

    return {
      messages:[
        new RemoveMessage({
          id:REMOVE_ALL_MESSAGES
        }),
        ...compressedMessages
      ]
    }
  },
});


export default contextRatio



