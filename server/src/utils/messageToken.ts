import { get_encoding } from "tiktoken";
import { BaseMessage } from "langchain"
import { getMessageText } from "../utils/getMessageText";


//初始化编码器
const encoder = get_encoding("cl100k_base")

//估算消息的总token数量
export const estimateMessageTokens = (messages:BaseMessage[])=>{
//   let initTotalToken = 0
  const totalToken = messages.reduce((accumulator:number,currentValue:BaseMessage)=>{
    return accumulator + encoder.encode(getMessageText(currentValue)).length
  },0)
  return totalToken
}


//按 token 预算截断文本
//没有用 encoder.decode 反解：它返回的是字节数组，且按 token 硬切可能切出半个 UTF-8 字符，
//中文场景会出乱码。这里按「平均每字符占多少 token」反推保留长度，误差方向偏保守（多截一点）。
export const truncateByTokens = (text:string,maxTokens:number)=>{
  const totalToken = encoder.encode(text).length

  if(totalToken <= maxTokens) return text

  const keepChars = Math.floor(text.length * (maxTokens / totalToken) * 0.95)

  return text.slice(0,Math.max(keepChars,0)) + "\n…（内容过长，已截断）"
}


//计算一段文本的token
export const countTokens = (text:string)=>{
  return encoder.encode(text).length
}
