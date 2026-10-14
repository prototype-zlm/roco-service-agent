import { Router } from "express"
import { AppError } from "../utils/AppError"
import { checkpointer } from "../agent/agentMain"
import { generateTitle } from "../services/generateTitle.js"

const router = Router()


// 删除会话
router.post("/delete_messages", async (req, res) => {
  try {
    const thread_id = req.body.thread_id

    if (!thread_id || typeof thread_id !== "string") {
      return res.status(400).json({ success: false, message: "会话 ID 不能为空" })
    }

    await checkpointer.deleteThread(thread_id)
    res.json({ success: true })
  } catch (error) {
    const err = error as AppError;
    res.status(500).json({ success: false, message: err.message })
  }
})


//生成对话标题
router.post("/generate_title", async (req, res) => {
  try {
    const message = req.body.message
    if (!message) {
      return res.status(400).json({ success: false, message: "消息不能为空" })
    }
    const title = await generateTitle(message)
    res.json({ success: true, title })
  } catch (error) {
    const err = error as AppError;
    res.status(500).json({ success: false, message: err.message })
  }
})



export default router