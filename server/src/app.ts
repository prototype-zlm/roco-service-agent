import express from "express"
import cors from "cors"
import { Request,Response,NextFunction } from "express"

import chatRouter from "./routes/chat"
import healthRouter from "./routes/health"
import messageRouter from "./routes/messages"
import { AppError } from "./utils/AppError"

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api", chatRouter)
app.use("/api", healthRouter)
app.use("/api", messageRouter)

app.use((err:Error,req:Request,res:Response,next:NextFunction)=>{
  console.error(err)
  const statusCode = (err as AppError).statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: err.message,
  })
})

export default app