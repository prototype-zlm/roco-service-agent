import * as zod from "zod";
import { smallModel } from "../models/index.js";
import { ChatPromptTemplate, FewShotChatMessagePromptTemplate } from "@langchain/core/prompts"


export async function generateTitle(messages: string) {

    const schema = zod.object({
        title: zod.string().trim().min(1).max(15).describe("对话标题"),
    });

    const structuredModel = smallModel.withStructuredOutput(schema, {
        strict: true,
    });


    const examples = [
        {
            input: "洛克王国世界里面火花怎么培养比较好？",
            output: "火花培养攻略"
        },
        {
            input: "cudhygszojgbu!xa啊",
            output: "无明确主题"
        },
        {
            input: "你好!",
            output: "问候"
        },
        {
            input: "介绍一下你自己",
            output: "助手介绍"
        },
        {
            input: "新手开局应该怎么玩？",
            output: "新手入门攻略"
        },
        {
            input: "谢谢你",
            output: "表达感谢"
        },
        {
            input: "你能帮我做什么？",
            output: "助手功能介绍"
        },
        {
            input: "随便聊聊",
            output: "闲聊"
        }
    ]

    const examplePrompt = ChatPromptTemplate.fromMessages([
        ['human', "{input}"],
        ['ai', "{output}"]
    ])

    const fewShotPrompt = new FewShotChatMessagePromptTemplate({
        examplePrompt,  //示例格式
        examples,  //示例数据
        inputVariables: ["input"]
    })

    const finalPrompt = ChatPromptTemplate.fromMessages([
        ['system', `
        你是一个对话标题生成器，你的任务是根据用户的第一次对话，生成一个对话标题。
        标题需要能反映用户的问题和需求，不能包含任何个人意见或判断。
        标题需要简洁明了，不能超过15个字符。
        `],
        ... await fewShotPrompt.formatMessages({}),
        ['human', "{input}"],
    ])
    const chain = finalPrompt.pipe(structuredModel)

    const result = await chain.invoke({
        input: messages
    })
    return result.title
}