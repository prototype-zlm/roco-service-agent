import { OpenAIEmbeddings } from "@langchain/openai";
import { Chroma } from "@langchain/community/vectorstores/chroma";



export const embeddings = new OpenAIEmbeddings({
  model: `${process.env.SILICONFLOW_VECTOR_MODEL}`,
  apiKey: process.env.SILICONFLOW_API_KEY,
  configuration: {
    baseURL: process.env.SILICONFLOW_BASE_URL,
  },
});

export const vectorStore = new Chroma(embeddings, {
  collectionName: "roco-bge-m3",
  url: "http://localhost:8000",
});

// export const makeRetriever = (entityType: string, k = 3) =>
//   vectorStore.asRetriever({ k, filter: { 
//     entity_type: { $eq: entityType } ,
//   } });


  export const searchByType = async (entityType: string, question: string, k = 3) => {
  const hits = await vectorStore.similaritySearchWithScore(question, k, {
    entity_type: { $eq: entityType },
  });

  // 不同的实体类型对应的阈值，越小相似度越高
  const entityTypeDistanceMax: Record<string, number> = {
    "pet":1,
    "skill":1,
    "evolution":1,
    "BaiduBaike_roco":1.2
  }

  const distanceMax = entityTypeDistanceMax[entityType] ?? 1.5;

  // console.log("查询：【document,分数】:")
  // console.dir(hits,{depth:null});
  return hits.filter(([, score]) => score <= distanceMax).map(([doc]) => doc);
};





// | VectorStore | 分数含义 | 阈值方向 |
// |---|---|---|
// | MemoryVectorStore | 余弦相似度，越大越相似（[-1, 1]） | `score >= threshold` |
// | HNSWLib | 余弦相似度 / 内积（取决于配置） | `score >= threshold` |
// | Chroma | L2 距离，越小越相似（默认 `l2`） | `score <= threshold` |
// | Milvus / Qdrant（部分配置） | 距离，0 = 完全相似，1 = 完全不相似 | `score <= threshold` |

