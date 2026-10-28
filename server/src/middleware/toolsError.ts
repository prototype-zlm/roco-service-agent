import { GraphRecursionError } from "@langchain/langgraph";
import { createMiddleware,ToolMessage } from "langchain";



const toolsError = createMiddleware({
    name:"全局工具报错拦截",
    wrapToolCall:async (request,handler)=>{
      try {
        return await handler(request)
      } catch (error:any) {
        console.error("工具调用报错，报错的原因是:",error.message || '未知原因')
        // 对GraphRecursionError报错,步数跑满了
        if(error instanceof GraphRecursionError || error.lc_error_code === "GRAPH_RECURSION_LIMIT"){
            return new ToolMessage({
                content:"已达到最大递归步数，该任务无法完成。不要以任何方式再次尝试该任务，直接告知用户该任务过于复杂。",
                tool_call_id:request.toolCall.id!
            })
        }
        return new ToolMessage({
            content:`工具调用报错，报错的原因是:${error.message || '未知原因'}。若报错指出参数不合法，必须从报错列出的合法取值中重新选择；不要猜测未列出的值。若确实没有匹配项，直接说明无法完成，不要编造答案`,
            tool_call_id:request.toolCall.id!
        })
      }
    } 
})

export default toolsError