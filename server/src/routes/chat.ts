import { Router } from "express";
import { AIMessageChunk,ToolMessage } from "@langchain/core/messages";
import { chat } from "../services/chat";
import { AppError } from "../utils/AppError";
import { getMessageText } from "../utils/getMessageText";

const router = Router();

router.post("/chat", async (req, res) => {

  //user_id现在用不到，等后面做认证功能的时候，需要校验user_id是否和sessionid相关联，防止用别人的thread_id，读到别人的会话
  const { message,user_id,thread_id } = req.body;

  // 校验必须在设置 header 之前，此时还能正常返回 JSON
  if (!message || typeof message !== "string") {
    return res.status(400).json({ success: false, message: "消息不能为空" });
  }
  if (!thread_id || typeof thread_id !== "string") {
    return res.status(400).json({ success: false, message: "会话 ID 不能为空" });
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const controller = new AbortController();
  let clientAborted = false;

  res.on("close", () => {
    //writableEnded表示res.end是否调用，如果调用了就为true，表示写完了。
    if (!res.writableEnded) {
      clientAborted = true;
      console.warn("[chat] 客户端提前断开，取消本次 run", { thread_id });
      controller.abort();
    }
  });

  try {
    const stream = await chat(message,thread_id, controller.signal);

    for await (const [chunk,meta] of stream) {


      // 工具执行完成
      //放到AIMessageChunk之前，防止被过滤掉
      if (chunk instanceof ToolMessage) {
        res.write(`event: progress\ndata: ${JSON.stringify({ tool: chunk.name })}\n\n`);
        continue;
      }

      if (!(chunk instanceof AIMessageChunk)) continue;

      // 模型决定要调某个工具
      // 可以放到AIMessage后，因为这个也属于AI输出，只是content为空，所以getMessageText拿不到内容，这是正常的。
      // 但是要放到lc_agent_name判断之前，因为工具的调用，并不都是agentMain调用的
      const calls = chunk.tool_call_chunks;
      if (calls?.length) {
        for (const c of calls) {
          if (c.name) {
            res.write(`event: progress\ndata: ${JSON.stringify({ tool: c.name })}\n\n`);
          }
        }
      }

      if(meta?.lc_agent_name !== "agentMain") continue;
      const text = getMessageText(chunk);
      if (!text) continue;
      res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
  } catch (error) {
    const err = error as AppError;

    // 客户端已经走了就没必要再写，也不该按服务错误记录
    if (clientAborted) {
      console.warn("[chat] run 已因客户端断开被取消", { thread_id });
    } else {
      console.error("[chat] 流式输出失败", { thread_id, error });
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || "服务出错了" })}\n\n`);
    }
  } finally {
    res.end();
  }

});

export default router;
