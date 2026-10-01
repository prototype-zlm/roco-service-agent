import { AppError } from "../utils/AppError";
import { agentMain } from "../agent/agentMain";

export async function chat(
  message: string,
  thread_id: string,
  signal?: AbortSignal,
) {
  if (!message) throw new AppError("消息不能为空", 400);

  return agentMain.stream(
    { messages: [{ role: "human", content: message }] },
    {
      configurable: {
        thread_id,
      },
      streamMode: "messages",
      signal,
    },
  );
}