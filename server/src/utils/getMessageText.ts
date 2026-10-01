import { BaseMessage } from "langchain"
export function getMessageText(message: BaseMessage): string {
  if (typeof message.content === "string") {
    return message.content
  }

  return message.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("")
}