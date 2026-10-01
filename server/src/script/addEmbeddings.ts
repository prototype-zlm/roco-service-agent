import "dotenv/config";
import { Document } from "@langchain/classic/document";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import BaiduBaike_roco from "../data/BaiduBaike_roco.json";
import { BaiduBaikeRoco_to_text } from "./dataToText";

const embeddings = new OpenAIEmbeddings({
  model: "BAAI/bge-m3",
  apiKey: process.env.SILICONFLOW_API_KEY,
  configuration: {
    baseURL: process.env.SILICONFLOW_BASE_URL,
  },
});

// 格式参考：
// 插入精灵详情数据到向量数据库中
// const documents = pets.map((pet: any) => {
//   return new Document({
//     pageContent: petToText(pet),
//     metadata: {
//       entity_id: `pet_${pet.id}`,
//       entity_type: "pet",
//       name: pet.name,
//       source: "pets.json",
//     },
//   });
// });





const documents = BaiduBaike_roco.map((data: any) => {
  return new Document({
    pageContent: BaiduBaikeRoco_to_text(data),
    metadata: {
      entity_id: `BaiduBaike_roco_${data.title}`,
      entity_type: "BaiduBaike_roco",
      name: data.title,
      source: "BaiduBaike_roco.json",
    },
  });
})


// console.dir(documents, { depth: null, colors: true });





const vectorStore = new Chroma(embeddings, {
  collectionName: "roco-bge-m3",
  url: "http://localhost:8000",
});

let documentsCount = 0;
let errorCount = 0;
let errIds = []
for (const document of documents) {
  try {
    await vectorStore.addDocuments([document],{
        ids:[document.metadata.entity_id]
    });
    documentsCount++;
    console.log(`${documentsCount}/${documents.length}`);
  } catch (error) {
    errorCount++;
    errIds.push(document.metadata.entity_id)
    console.log("报错了,错误原因是:", error);  
  }
}

console.log("成功插入", documentsCount, "条数据");
console.log("失败插入", errorCount, "条数据");
console.log("失败的id是", errIds);
