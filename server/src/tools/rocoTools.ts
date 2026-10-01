import "dotenv/config";
import * as z from "zod";
import { tool } from "langchain";
import { searchByType } from "../rag/index";
import type_chart from "../data/type_chart.json";
import stats from "../data/stats.json";
import skills from "../data/skills.json"
import learnset from "../data/learnset.json"
import pets from "../data/pets.json"
import evolution_chains from "../data/evolution_chains.json"
import cluster_definitions from "../data/cluster_definitions.json"
import { RULE_SECTIONS,SECTION_NAMES } from "../prompts/battle-slice"
import { TAG_DEFS, TAG_NAMES,SynergyTag } from "../utils/synergy_tagger"


// 已灌注：
// 1.精灵信息
// 2.技能信息
// 3.精灵进化链
// 4.百科


const PETS_MAP = new Map(pets.map(p => [p.name, p]))
const SKILL_MAP = new Map(skills.map(s => [s.name, s]))




const TYPES = [
  "光",
  "草",
  "火",
  "水",
  "普通",
  "幽灵",
  "恶",
  "翼",
  "地",
  "虫",
  "萌",
  "冰",
  "毒",
  "电",
  "武",
  "幻",
  "机械",
  "龙",
] as const;

type Type = (typeof TYPES)[number]


interface super_effective_types{
  type: Type,
  super_effective: Type[]
}

interface multiplier_type{
  [key: string]: number
}

interface by_super_effective_types{
  attack_type: Type,
  multiplier: multiplier_type,
  count?: number
}



const SYSTEM_NAMES = [
  "灼烧体系",
  "中毒消耗",
  "冻结控场",
  "星陨爆发",
  "萌化退化",
  "传动体系",
  "天气队",
  "应对返还",
  "印记运营",
  "先手压制",
  "吸血续航",
  "增益传递",
  "巧变切换",
] as const

type System = (typeof SYSTEM_NAMES)[number]




//查询精灵信息（RAG）
export const getPetData = tool(
  async ({ question,limit }) => {
    const k = Math.max(limit * 2, 3);
    const store = await searchByType("pet",question,k);

    return store.slice(0, limit);
  },
  {
    name: "洛克王国·世界精灵信息模糊查询",
    description: `
    当用户询问任何有关洛克王国·世界的精灵信息时，调用该工具，工具会根据用户的问题，返回用户期望数量的相关的精灵信息。

    置信度高的精灵信息会排在前面，置信度低的精灵信息会排在后面。

    精灵信息包含以下字段：
      精灵名称
      属性
      生命
      攻击
      物防
      魔攻
      魔抗
      速度
      种族值
      特性
      身高
      体重
      介绍
      获取方式
      技能
      技能石
      血脉技能


      适合场景：
      - 不给名字、只给特征（"有个精灵造成克制伤害后能回能"）；问"介绍/背景/获取方式"这类描述性内容

      不适合场景：
      - 已给出精灵名字——一律走精确工具
`,
    schema: z.object({
      question: z.string().describe("用户的问题"),
      limit: z.number().describe("表示最终需要返回给用户的结果数量，不代表底层向量检索的召回数量").max(5),
    }),
  },
);
//查询技能信息（模糊）（RAG）
export const getSkillData = tool(
  async ({question,limit})=>{
    const k = Math.max(limit * 2, 5);
   const store = await searchByType("skill",question,k);

    return store.slice(0, limit);
  },
  {
    name:"洛克王国·世界技能信息模糊查询",
    description:`
    当用户询问任何有关洛克王国·世界的技能信息时，调用该工具，工具会根据用户的问题，返回用户期望数量的相关的技能信息。

    置信度高的技能信息会排在前面，置信度低的技能信息会排在后面。

    技能信息包含以下字段：
    name: 技能名称
    type: 技能属性
    category: 技能分类
    power: 技能威力
    accuracy: 技能命中
    energy: 技能消耗
    effect: 技能描述

    适合场景：
    - 用户询问技能问题，但是并没有明确给出技能名称，比如：
    有个技能使用后会让自己物攻+30%，3连击，这个技能叫什么？

    不适合场景：
    - 用户询问技能问题，并明确给出了技能名称，比如：
    不动如山这个技能的效果是什么？威力多少？
    `,
    schema: z.object({
      question: z.string().describe("用户的问题"),
      limit: z.number().describe("表示最终需要返回给用户的结果数量，不代表底层向量检索的召回数量").max(5),
    }),
  }
)
//查询精灵进化链（RAG）
export const getPetEvolution = tool(
  async ({question,limit})=>{
    const k = Math.max(limit * 2, 5);
    const store = await searchByType("evolution",question,k);

    return store.slice(0, limit);
  },
  {
    name:"洛克王国·世界精灵进化链模糊查询",
    description:`
    当用户询问任何有关洛克王国·世界的精灵进化链时，调用该工具，工具会根据用户的问题，返回用户期望数量的相关的精灵进化链信息。

    置信度高的精灵进化链信息会排在前面，置信度低的精灵进化链信息会排在后面。

    进化链信息包含以下字段，以果冻进化链为例：
      进化链: 果冻进化链
      共有2种形态
      最强形态为: 抹茶布丁
      进化分支: 果冻——>抹茶布丁
      第1阶段编号为313，种族值为437
      第2阶段编号为314，种族值为546
      第1阶进化需要等级达到30,
    `,
    schema: z.object({
      question: z.string().describe("用户的问题"),
      limit: z.number().describe("表示最终需要返回给用户的结果数量，不代表底层向量检索的召回数量").max(5),
    }),
  }
)
//洛克王国·世界百科(RAG)
export const getBaiduBaike_roco = tool(
  async ({ question,limit }) => {
    const k = Math.max(limit * 2, 5);
    const store = await searchByType("BaiduBaike_roco",question,k);

    return store.slice(0, limit);
  },
  {
    name:"洛克王国·世界百度百科模糊查询",
    description:`
    当用户询问问题涉及洛克王国·世界中以下方向时：

    1.背景设定
    2.角色设定
    3.物品道具
    4.场景地图
    5.特色系统
    6.配置要求
    7.荣誉记录
    8.发布历程
    9.游戏测评

    调用该工具，工具会根据用户的问题，返回用户期望数量的相关的百科信息。

    置信度高的百科信息会排在前面，置信度低的百科信息会排在后面。

    适合场景：
    - 用户询问游戏背景设定
    - 用户询问游戏角色设定
    - 用户询问游戏物品道具
    - 用户询问游戏场景地图
    - 用户询问游戏特色系统
    - 用户询问游戏配置要求
    - 用户询问游戏荣誉记录
    - 用户询问游戏发布历程
    - 用户询问游戏测评

    不适合场景：
    - 用户询问精灵总数量
    - 用户询问技能总数量
    - 用户询问精灵技能学习记录总数
    - 用户询问某个属性有多少只精灵
    - 用户询问某一只精灵的具体信息
    - 用户询问某只精灵有哪些技能
    - 用户询问属性克制关系
    `,
    schema: z.object({
      question: z.string().describe("用户的问题"),
      limit: z.number().describe("表示最终需要返回给用户的结果数量，不代表底层向量检索的召回数量").max(5),
    }),
  }
)



//查询洛克王国·世界的统计数据
export const getGameStats = tool(
  ({ metric, type }) => {
    if (metric === "total_pets") {
      return {
        success: true,
        data: {
          metric,
          value: stats.total_pets,
        },
      };
    } else if (metric === "total_skills") {
      return {
        success: true,
        data: {
          metric,
          value: stats.total_skills,
        },
      };
    }else if(metric === "total_learnset"){
      return {
        success: true,
        data: {
          metric,
          value: stats.total_learnset,
        },
      }

    }else if (metric === "pet_count_by_type") {
      if (!type) {
        return {
          success: false,
          error: {
            code: "TYPE_REQUIRED",
            message: "查询某属性精灵数量时必须提供属性名称",
          },
        };
      }

      return {
        success: true,
        data: {
          metric,
          type,
          value: stats.types[type],
        },
      };
    }


    return{
        success: false,
        error: {
          code: "UNKNOWN_METRIC",
          message: "不支持的统计指标",
        },
    }
  },
  {
    name: "洛克王国·世界统计数据精确查询",
    description: `
      查询《洛克王国·世界》的统计数据。

      支持以下统计指标：

      - total_pets：知识库中收录的精灵总数量
      - total_skills：知识库中收录的不同技能总数量
      - total_learnset：所有精灵的技能总数量。
      - pet_count_by_type：指定属性的精灵数量，此时必须提供 type 参数。

      适用场景：
      - 用户询问精灵总数量
      - 用户询问技能总数量
      - 用户询问精灵技能学习记录总数
      - 用户询问某个属性有多少只精灵

      不适用于：
      - 查询某一只精灵的具体信息
      - 查询某只精灵有哪些技能
      - 查询属性克制关系
      `,
    schema: z.object({
      metric: z.enum(["total_pets", "total_skills","total_learnset", "pet_count_by_type"]),
      type: z
        .enum(TYPES)
        .describe("某个属性的精灵数量，传递该属性的名称")
        .optional(),
    }),
  },
);

//查询洛克王国·世界的克制关系
export const getPetChart = tool(
  (state) => {

    let type1: Type = state.type1
    let type2: Type | undefined = state.type2

    if (type2) {
      //type1为攻击方
      const chart1 = type_chart.chart[type1][type2];
      //type2为攻击方
      const chart2 = type_chart.chart[type2][type1];

      if (chart1 === undefined || chart2 === undefined) {
        return {
          success: false,
          error: {
            code: "MATCHUP_NOT_FOUND",
            message: "属性名称无效，请检查输入的属性名称是否正确",
          },
        };
      }

      return {
        success: true,
        data: {
        [`${type1}攻击${type2}`]: chart1,
        [`${type2}攻击${type1}`]: chart2,
        },
      };
    }else{

      let obj_1:Record<string,number> = {}
      let obj_2:Record<string,number> = {}

      for (const item of TYPES) {
        //type1为攻击方
        const chart1 = type_chart.chart[type1][item];
        //type2为攻击方
        const chart2 = type_chart.chart[item][type1];

        obj_1[item] = chart1
        obj_2[item] = chart2
      }

      return {
        success: true,
        data:{
            [`${type1}攻击各属性的倍率`]: obj_1,
            [`各属性攻击${type1}的倍率`]: obj_2,
        }
      };
    }
  },
  {
    name: "洛克王国·世界克制关系精确查询",
    description:`
    查询洛克王国中不同属性之间的克制关系，仅当需要查询属性之间的克制倍率时使用。
    工具允许两种查询方式：
    1.当有明确的攻击方和防守方时，此时需要同时传递type1和type2参数。
    2.当只有任意一方时，需要传递type1参数，此时返回type1对全部18个属性的克制关系。

    补充说明：
    - 克制倍率取值：**0**（免疫）/ **0.5**（抵抗）/ **1**（正常）/ **2**（克制）
    - **多重克制为加算**：双属性同时被克制 = 1 + 1 + 1 = **3 倍**
    `,
    schema: z.object({
      type1: z
        .enum(TYPES)
        .describe("属性名"),
      type2: z
        .enum(TYPES)
        .optional()
        .describe("对比属性名。不传则返回 type1 对全部 18 个属性的完整克制关系"),
    }),
  },
);

//查询洛克王国·世界中某个精灵的信息(精确)
export const getPetInfo = tool(
  ({pet_name})=>{
    const pet = pets.find((p) => p.name === pet_name);
    //全等匹配没找到，试试部分匹配
    if (!pet) {
     let filter_pets = pets.filter((p)=>{
        return p.name.includes(pet_name)
      })
      //部分匹配也没找到
      if(!filter_pets.length){
        return {
          success: false,
          error: {
            code: "PET_NOT_FOUND",
            message: "精灵名称无效，请检查输入的精灵名称是否正确",
          },
        };
      }

      return {
        success: true,
        data:{
          pets_name:filter_pets.map((item)=>item.name).join(", "),
          message:"未发现完全匹配的精灵，这里展示部分匹配符合的候选名列表，请与用户确认"
        }
      }
    }

    return {
      success: true,
      data: {
        精灵名称:pet.name,
        属性: pet.type_secondary ? `${pet.type_primary}/${pet.type_secondary }`: pet.type_primary,
        生命: pet.stats.hp,
        攻击: pet.stats.atk,
        物防: pet.stats.defense,
        魔攻: pet.stats.sp_atk,
        魔抗: pet.stats.sp_def,
        速度: pet.stats.speed,
        种族值: pet.stats.total,
        特性: pet.ability,
        身高: pet.height,
        体重: pet.weight,
        介绍: pet.description,
        获取方式: pet?.evolution_chain?.[0]?.name ?? (pet.how_to_get ? "使用技能:" + pet.how_to_get : "未知"),
        技能: pet.skills.join(", "),
        技能石: pet.stone_skills.join(", "),
        血脉技能: pet.bloodline_skills.join(", ")}
      }
  },
  {
    name: "洛克王国·世界精灵信息精确查询",
    description: `
    当用户询问有关洛克王国·世界的精灵信息时，调用该工具。

    工具接收一个参数，精灵名称，工具会返回该精灵的完整信息，包含：
      精灵名称
      属性
      生命
      攻击
      物防
      魔攻
      魔抗
      速度
      种族值
      特性
      身高
      体重
      介绍
      获取方式
      技能
      技能石
      血脉技能

      适合场景：
      - 用户明确给出精灵名称，询问该精灵的相关信息时。

      不适用于：
      - 用户不给名字、只给特征（"有个精灵造成克制伤害后能回能"）；问"介绍/背景/获取方式"这类描述性内容

   
      注：当精灵获取方式出现"使用技能"时，则代表使用指定技能即可获取该精灵。
     `,
    schema: z.object({
      pet_name: z.string().describe("精灵名称，若名称为xxx的样子，则只传递精灵名即可"),
    })
  }
)

//查询洛克王国·世界中某个技能的具体效果（精确）
export const getSkillEffect = tool(
  ({skill_name})=>{
    const skill = skills.find((s) => s.name === skill_name);
    if (!skill) {
      return {
        success: false,
        error: {
          code: "SKILL_NOT_FOUND",
          message: "技能名称无效，请检查输入的技能名称是否正确",
        },
      };
    }

    return {
      success: true,
      data: {
        name: skill.name,
        type: skill.type,
        category: skill.category,
        power: skill.power,
        accuracy: skill.accuracy,
        energy: skill.energy,
        effect: skill.effect,
      },
    };

  },{
    name: "洛克王国·世界技能效果精确查询",
    description: `
    当用户询问任何有关洛克王国·世界的技能效果时，调用该工具。

    工具接收一个参数，技能名称，工具会返回该技能的具体效果：
    name: 技能名称
    type: 技能属性
    category: 技能分类
    power: 技能威力
    accuracy: 技能命中
    energy: 技能消耗
    effect: 技能描述

    适合场景：
    - 用户询问某个技能的具体效果,比如：
    不动如山这个技能的效果是什么？威力多少？

    不适合场景：
    - 用户询问技能问题，但是并没有给出技能名称，比如：

    有个技能使用后会让自己物攻+30%，3连击，这个技能叫什么？
    有个技能消耗5个能量，并能对敌方造成140伤害，这个技能叫什么?
    `,
    schema: z.object({
      skill_name: z.string().describe("技能名称"),
    }),
  }
)

//查询洛克王国·世界中某种技能可以学会的精灵（通过技能反查精灵）
export const getPetsBySkill = tool(
  async ({skill_name, max_total})=>{

    let petsBySkill = learnset.filter((item)=>{
      return item.skill_name === skill_name
     })
     if(petsBySkill.length === 0){
        return {
          success: false,
          error: {
            code: "PET_NOT_FOUND",
            message: "没有找到可以学会该技能的精灵，请检查输入的技能名称是否正确",
          },
        }
     }
     if(max_total && petsBySkill.length > max_total){
        petsBySkill = petsBySkill.slice(0, max_total)
     }

     return {
      success:true,
      data:{
        pets:petsBySkill.map((item)=>item.pet_name).join('、')
      },
     }
  },{
    name:"洛克王国·世界技能反查精灵",
    description:`
    当用户询问任何有关洛克王国·世界中某种技能可以学会的精灵时，调用该工具。
    工具接收两个参数:
    skill_name: 技能名称,
    max_total: 最大返回数量（可不传，不传则返回所有可习得该技能的精灵）
    工具会返回可以学会该技能的精灵列表,列表中精灵顺序按照精灵id顺序排列。
    `,
    schema: z.object({
      skill_name: z.string().describe("技能名称"),
      max_total: z.number().min(1).optional().describe("最大返回数量（可不传，不传则返回所有可习得该技能的精灵）"),
    }),
  }
)

//查询战斗手册
export const getBattleRules = tool(
  async ({ section }) => {
    return {
      success: true,
      data: {
        section,
        content: RULE_SECTIONS[section],
      },
    }
  },
  {
    name: "洛克王国·世界战斗机制规则",
    description: `
    查询《洛克王国·世界》战斗机制的详细规则。
    涉及任何具体公式、数值、机制细节时必须调用本工具取回对应章节，禁止凭其他宝可梦类游戏的常识推断。

    各章节包含的内容：
    - 属性克制：18 种属性、克制倍率取值、多重克制加算规则、基础三角与互克体系
    - 伤害计算：核心伤害公式、星陨伤害公式、灼烧伤害公式
    - 种族值与属性公式：六维种族值、实际属性计算公式、性格倍率的取值范围
    - 性格：30 种性格的提升/削减对照表、固定性格精灵的数量分布
    - 天分与培养：天分等级与个体值加成、等级/升星/突破规则
    - 觉醒：解锁条件、每层加成、1~5 次的累计加成表
    - 技能系统：技能分类、「应对」三角克制闭环、技能标签、天气
    - 异常状态：灼烧/中毒/冻结/星陨/萌化/寄生 的数值、衰减与触发时机
    - 印记系统：印记覆盖规则、全部正面与负面印记、覆盖规则的例外
    - 血脉系统：血脉更换规则、战前二选一（进化之力 / 愿力冲击）
    - 精灵特性：特性的设计类别与各系别设计方向
    - 能量与魔力值：能量上限与回能手段、魔力值与胜负判定
    - 对战规则与赛季：队伍规模、速度与先手、PVP 平衡、S1~S3 赛季与版本改动

    一次只能取一个章节，需要多个章节时分多次调用。
    算伤害通常需要先取「伤害计算」，再按需补「属性克制」「觉醒」「印记系统」。

    注意：本工具只返回机制与公式，不含任何具体精灵、技能的数据。
    查某只精灵的属性/种族值/特性请用精灵信息工具，
    查某个技能的威力/效果请用技能效果工具，
    查两个属性之间的具体倍率请用克制关系工具。
    `,
    schema: z.object({
      section: z.enum(SECTION_NAMES).describe("要查询的章节"),
    }),
  }
);

//根据条件查询精灵信息
export const searchPets = tool(
  async ({ type, type2, sort_by, order, attack_preference, limit })=>{

   //实际返回数
   let returned
   let arr_pets

   //根据属性过滤
   let type_pets = pets.filter((item)=>{
      if(type2){
        return (type === item.type_primary || 
          type === item?.type_secondary) &&
         (type2 === item?.type_secondary || 
          type2 === item.type_primary)
      }else{
        return type === item.type_primary || type === item?.type_secondary
      }
    })

    //过滤掉进化链里的非最终形态（不在任何链里的精灵视为独立终态，保留）
    type_pets = type_pets.filter((item) => {
      return !evolution_chains.chains.some(
        chain => chain.member_names.includes(item.name) && chain.apex_name !== item.name
      )
    }) 

    //根据攻击偏好过滤
   let attack_pets = type_pets.filter((item)=>{
      if(attack_preference === '物理'){
        return item.stats.atk > item.stats.sp_atk * 1.15
      }else if(attack_preference === '魔法'){
        return item.stats.sp_atk > item.stats.atk * 1.15
      }else if(attack_preference === '双刀'){
        return item.stats.atk <= item.stats.sp_atk * 1.15 && item.stats.sp_atk <= item.stats.atk * 1.15
      }else{
        return true
      }
    })

    //按种族值中的某一项进行排序
   let sort_pets = attack_pets.sort((a,b)=>{
      if(sort_by === 'hp'){
        return order === 'desc' ?  b.stats.hp - a.stats.hp : a.stats.hp - b.stats.hp
      }else if(sort_by === 'atk'){
        return order === 'desc' ?  b.stats.atk - a.stats.atk : a.stats.atk - b.stats.atk
      }else if(sort_by === 'sp_atk'){
        return order === 'desc' ?  b.stats.sp_atk - a.stats.sp_atk : a.stats.sp_atk - b.stats.sp_atk
      }else if(sort_by === 'defense'){
        return order === 'desc' ?  b.stats.defense - a.stats.defense : a.stats.defense - b.stats.defense
      }else if(sort_by === 'sp_def'){
        return order === 'desc' ?  b.stats.sp_def - a.stats.sp_def : a.stats.sp_def - b.stats.sp_def
      }else if(sort_by === 'speed'){
        return order === 'desc' ?  b.stats.speed - a.stats.speed : a.stats.speed - b.stats.speed
      }else{
        return order === 'desc' ?  b.stats.total - a.stats.total : a.stats.total - b.stats.total
      }
   })

   if(!sort_pets.length){
    return {
      success: false,
      error: {
        code: "PET_NOT_FOUND",
        message: "没有找到符合该条件的精灵，请检查输入的参数是否正确",
      },
    }
   }

   //映射为统一的返回格式
   let map_pets = sort_pets.map((item)=>{
      return {
        name:item.name,
        type:item.type_secondary ? `${item.type_primary}/${item.type_secondary }`: item.type_primary,
        stats:{
          hp:item.stats.hp,
          atk:item.stats.atk,
          defense:item.stats.defense,
          sp_atk:item.stats.sp_atk,
          sp_def:item.stats.sp_def,
          speed:item.stats.speed,
          total:item.stats.total
        },
        ability:item.ability,
        attack_preference
      }
   })

   if(map_pets.length > limit){
    arr_pets = map_pets.slice(0,limit)
    returned = limit
   }else{
    returned = map_pets.length
    arr_pets = map_pets
   }

   return {
    success:true,
    data:{
      total_matched:map_pets.length,
      returned,
      filter:{
        type:type2 ? `${type}/${type2}` : type,
        sort_by,
        order
      },
      pets:arr_pets
    }
   }

  },
  {
    name:"洛克王国·世界精灵信息条件查询",
    description:`
    当需要根据某些条件去筛选精灵时，调用工具。

    工具接受6个参数：
    type：会匹配所有精灵的主副属性。
    type2：当type2 填了，会和type配合，一起匹配同时拥有主副属性的精灵。
    sort_by：排序字段，可选值有：
      hp：生命, 
      atk：物攻, 
      defense: 物防, 
      sp_atk：魔攻, 
      sp_def：魔抗, 
      speed: 速度, 
      total: 种族值
    order：排序顺序，可选值有：
      desc：降序, 、
      asc：升序
    attack_preference：攻击偏好，可选值有：
      物理：物攻 > 魔攻 * 1.15, 
      魔法：魔攻 > 物攻 * 1.15, 
      双刀：无偏置，双攻接近
    limit：返回数量，默认为8，最大15

    返回结果：
    total_matched：符合条件的精灵总数
    returned：实际返回数量
    filter：筛选条件
    pets：返回的精灵信息，非完整精灵信息，只返回名称、主副属性、攻击偏好、种族值、特性

    适用场景：当需要跟你某些条件筛选精灵时调用，比如：电系物攻最高的精灵
    不适用场景：1.根据精灵名称查询精灵信息 2. 根据精灵的特性、背景等描述类信息查询精灵信息
    `,
    schema: z.object({
      type:  z.enum(TYPES),
      type2: z.enum(TYPES).optional(),
      sort_by: z.enum(["hp","atk","defense","sp_atk","sp_def","speed","total"])
              .default("total"),
      order: z.enum(["desc","asc"]).default("desc"),
      attack_preference: z.enum(["物理","魔法","双刀"]).optional(),
      limit: z.number().max(15).default(8),
    })
  }
)

//队伍属性覆盖分析
export const analyzeTeamCoverage = tool(
  async ({ pet_names })=>{

    //队伍中能克制的属性
    let super_effective:super_effective_types[] = []
    //队伍中被克制的属性
    let by_super_effective:by_super_effective_types[] = []
    //队伍中所有属性对这些属性没有克制
    let not_covered = [] as Type[]
    //队伍中的所有属性都不怕的属性
    let team_resistances = [] as Type[]
    // 攻击覆盖率
    let attack_coverage:number
    // 防御覆盖率
    let defense_coverage:number

    //收集队伍中的属性对哪些属性克制
    let coveredSet = new Set<Type>()
    //收集队伍中的属性都被哪些属性克制，数组
    let team_resistancesSet = new Set<Type>()



    for (const pet_names_item of pet_names) {
      //先根据名称获取精灵信息
      let pet_info = PETS_MAP.get(pet_names_item)
      if(!pet_info) {
        return {
          success: false,
          error: {
            code: "PET_NOT_FOUND",
            message: `没有找到名为${pet_names_item}的精灵，请检查输入的精灵名称是否正确`,
          },
        }
      }

      //从精灵信息中获取属性
      let {skills:skill1,stone_skills:skill2,bloodline_skills:skill3,type_primary,type_secondary} = pet_info

      //获取这只精灵所能学习的技能的属性，并集
      let this_skills_type = new Set<Type>()


      //获取技能属性
      for (const skill_name of skill1.concat(skill2).concat(skill3)) {
        //获取技能属性
       let skill_info = SKILL_MAP.get(skill_name)
        if(!skill_info){
          continue
        }
        //获取技能属性
        let { type,category } = skill_info
      
        //只有物理技能/魔法技能才能造成伤害，才能打出克制
        if(category === '物理' || category === '魔法'){
            this_skills_type.add(type as Type)
        }
      }

      //哪些属性能够造成克制?
      this_skills_type.forEach((item)=>{
        let super_effective_obj = {
          type:item, //精灵技能的某个属性
          super_effective:[] as Type[],   //能够对哪些属性造成克制
        };

        (Object.entries(type_chart.chart[item]) as [Type,number][]).forEach((item_1)=>{
          if(item_1[1] === 2.0){
            super_effective_obj.super_effective.push(item_1[0])

            //获取队伍中所有属性对哪些属性没有克制,先获取能克制哪些，再取反
            coveredSet.add(item_1[0])
          }
       })
       //只有技能的属性对哪些属性有克制，才加入列表
       if(super_effective_obj.super_effective.length > 0){
          const index = super_effective.findIndex(
            (item) => item.type === super_effective_obj.type
          )

          if (index === -1) {
           super_effective.push(super_effective_obj)
          }
       }    
      })


      // 获取哪些属性被克制，这个时候就按照精灵自身的属性了
      TYPES.forEach((item)=>{
        let shared_weaknesses = {
            attack_type:"" as Type, 
            multiplier:{} as multiplier_type,
        };

         const m1 = type_chart.chart[item][type_primary as Type]
         const m2 = type_secondary ? type_chart.chart[item][type_secondary as Type] : undefined
         let times = 1 + (m1 === 2 ? 1 : 0) + (m2 === 2 ? 1 : 0)

         if(times > 1){
            shared_weaknesses.attack_type = item
            shared_weaknesses.multiplier[pet_names_item] = times
            team_resistancesSet.add(item)
          
            const index = by_super_effective.findIndex(
              (item) => item.attack_type === shared_weaknesses.attack_type
            )

            if (index !== -1) {
              by_super_effective[index].multiplier[pet_names_item] = times
            } else {
              by_super_effective.push(shared_weaknesses)
            }
         }
      })

    }

     //获取队伍中所有属性对哪些属性没有克制
     not_covered = TYPES.filter((item)=>{
        return !coveredSet.has(item)
      })

      //获取队伍中所有属性都不怕哪些属性
     team_resistances = TYPES.filter((item)=>{
        return !team_resistancesSet.has(item)
      })

      //加count，并降序排序
     by_super_effective = by_super_effective
      .map(x => ({ ...x, count: Object.keys(x.multiplier).length }))
      .sort((a,b) => b.count - a.count)

     attack_coverage = (TYPES.length - not_covered.length) / TYPES.length
     defense_coverage = team_resistances.length / TYPES.length

    return {
      success: true,
      data: {
        super_effective,
        by_super_effective,
        not_covered,
        team_resistances,
        attack_coverage,
        defense_coverage,
      },
    };

  },
  {
    name:"洛克王国队伍属性覆盖分析",
    description:`
    
    当需要分析你的队伍的属性覆盖情况时，调用工具。
    工具接受一个参数：
    pet_names：队伍中所有精灵的名字，数量为2-6

    返回结果：

    super_effective：队伍中能造成克制的属性，其中：
      每个对象都包含type和super_effective属性，
      字段含义如下：
      type：队伍中能够造成伤害的技能的属性
      super_effective：能够对哪些属性造成克制

    by_super_effective：队伍中被克制的属性，其中：
      每个对象都包含attack_type和multiplier属性，
      字段含义如下：
      attack_type：克制队伍的属性
      multiplier：哪些精灵会被这个属性克制，比如：
      {
        attack_type："光",
        multiplier：{
          "花影羚羊":2.0
        }
      }
      含义就是光属性，会对队伍中的花影羚羊造成克制

    not_covered：队伍中所有属性对哪些属性没有克制

    team_resistances：不能对队伍中的任何属性造成克制的属性，这些属性对队伍中的所有精灵属性都没有克制关系

    attack_coverage：攻击覆盖率，队伍中能够造成的克制面和总属性数量之比
    defense_coverage：防御覆盖率，不能对队伍中的属性造成克制的属性数量和总属性数量之比


    注意：
    1.攻击面统计是按照该精灵所能学习的技能的属性，而并非精灵本身的属性；防守面则是按照精灵自身的属性。
    2."不能对队伍中的属性造成克制"指的是某一个属性，攻击队伍中任何一个精灵，倍率为0.5或1.0

    适用场景：当需要分析你的队伍的覆盖情况时，调用工具。
    不适用场景：非配队需求。
    `,
    schema: z.object({
      pet_names: z.array(z.string()).min(2).max(6).describe("队伍中所有精灵的名字,数量为2-6")
    })
  }
)

//体系分析
export const team_system_analysis = tool(
  async ({ system,pet_names,skill_name,get_system_info,limit })=>{

    if(!system && !pet_names && !skill_name && !get_system_info){
      return {
        success: false,
        error: {
          code: "PARAM_REQUIRED",
          message: "参数缺失，请检查输入的参数是否正确",
        },
      };
    }

    /**
     * 精灵体系评分
     * @param system  指定的体系
     * @param only_core  是否只返回命中体系中核心机制
     * @param apex_only  是否过滤掉低阶精灵，只保留最高阶
     * @param pet_names  队伍中精灵的名字，不传递则代表查询符合指定体系的精灵
     * @returns  返回精灵名称、评分、命中的tag、前三个命中tag的精灵技能
     */
    const pet_system_score = function (system: System, only_core:boolean,apex_only:boolean,pet_names?: string[]):any {
      const system_info = cluster_definitions[system as System];

      //默认查询符合指定体系精灵的评分信息
      let target_pets = pets;

      //如果传递了队伍中精灵的名字，则查询符合指定体系且队伍中精灵的评分信息
      if (pet_names) {
        target_pets = [];

        for (const pet_name of pet_names) {
          const pet_info = PETS_MAP.get(pet_name);

         if (!pet_info) throw new Error(`没有找到名为${pet_name}的精灵`)

          target_pets.push(pet_info);
        }
      }

      let pets_top_n = [] as any[];

      for (const {
        name,
        stats,
        ability,
        skills: skill1,
        stone_skills: skill2,
        bloodline_skills: skill3,
      } of target_pets) {
        //精灵的可学技能的技能对象数组
        //这个filter的作用是过滤掉map.get未找到的undefined
        //s is typeof skills[number]的写法是告诉ts，filter过滤出来的对象，一定符合skills[number]
        const pet_skills = skill1
          .concat(skill2, skill3)
          .map((n) => SKILL_MAP.get(n))
          .filter((s): s is (typeof skills)[number] => !!s);


        //是否是低阶，目的是筛掉低阶精灵，保留最高阶以及一些不再进化链中的终态精灵
        const isNotApex = evolution_chains.chains.some(
          chain => chain.member_names.includes(name) && chain.apex_name !== name
        )

        let pet_name = name;
        let pet_score = 0;
        let core_tags = new Set<string>();
        let support_tags = new Set<string>();
        let core_skill_names = new Set<string>();
        let is_core = false;

        //根据core_tags筛选，这个得分高
        system_info.core_tags.forEach((item) => {
          if (TAG_DEFS[item as SynergyTag].test(ability)) {
            pet_score += 3;
            core_tags.add(item);
            is_core = true;
          }
          for (const skill_info of pet_skills) {
            if (TAG_DEFS[item as SynergyTag].test(skill_info.effect)) {
              pet_score += 2;
              core_tags.add(item);
              core_skill_names.add(skill_info.name);
              is_core = true;
            }
          }
        });
        //根据support_tags筛选
        system_info.support_tags.forEach((item) => {
          if (TAG_DEFS[item as SynergyTag].test(ability)) {
            pet_score += 1;
            support_tags.add(item);
          }
          for (const skill_info of pet_skills) {
            if (TAG_DEFS[item as SynergyTag].test(skill_info.effect)) {
              pet_score += 1;
              support_tags.add(item);
              break;
            }
          }
        });

        if(only_core && !is_core) continue;
        if(apex_only && isNotApex) continue;

        pets_top_n.push({
          system_name:system,
          pet_name,
          score: pet_score,
          is_core,
          stats_total:stats.total,
          core_tags: [...core_tags],
          core_skill_names: [...core_skill_names].slice(0, 3),
          support_tags: [...support_tags],
        });
      }

      return pets_top_n
    };

    /**
     * 技能体系评分
     * @param system  指定的体系
     * @param only_core  是否只返回命中体系中核心机制
     * @param skill_name  技能名称，不传递则查询指定体系的技能
     * @returns  返回技能名称、评分、命中的tag
     */
    const skill_system_score = function(system: System, only_core:boolean,skill_name?: string):any{
      const system_info = cluster_definitions[system as System]
      //默认查询符合指定体系技能的评分信息
      let target_skills = skills;
      //如果传递了技能名字，则查询符合指定体系的指定技能的评分信息
      if (skill_name) {
        target_skills = [];

          const skill_info = SKILL_MAP.get(skill_name);

          if (!skill_info) throw new Error(`没有找到名为${skill_name}的技能`)

          target_skills.push(skill_info);
        
      }

      let skills_top_n = [] as any[];

      for (const skill_item of target_skills) {
        let skill_name = skill_item.name
        let skill_score = 0
        let core_tags = new Set<string>();
        let support_tags = new Set<string>();
        let is_core = false;

        //根据core_tags筛选
        system_info.core_tags.forEach((item)=>{
          if(TAG_DEFS[item as SynergyTag].test(skill_item.effect)){
            skill_score += 3
            core_tags.add(item)
            is_core = true
          }
        })
        //根据support_tags筛选
        for (const item of system_info.support_tags) {
          if(TAG_DEFS[item as SynergyTag].test(skill_item.effect)){
              skill_score += 1
              support_tags.add(item)
              break
          }
        }

        if(only_core && !is_core) continue
          skills_top_n.push({
            skill_name,
            system_name:system,
            score:skill_score,
            is_core,
            core_tags:[...core_tags],
            support_tags:[...support_tags]
          })   
      }

      return skills_top_n
    }


    //模式D
    if(system && pet_names){
     let result = pet_system_score(system,false,false,pet_names)

     return{
       success: true,
       data:{
         pets_system:result
       }
     }
    }

    //模式A
    if(system){

      let pets_top_n = [] as any[];
      let skills_top_n = [] as any[];
      let pet_total_matched:number
      let skill_total_matched:number

      const system_info = cluster_definitions[system as System]

      //从精灵列表中筛选出符合指定体系的top n 精灵
      pets_top_n = pet_system_score(system,true,true)  

      //从技能列表中筛选出符合指定体系的top n 技能
      skills_top_n = skill_system_score(system,true)

      pet_total_matched = pets_top_n.length
      skill_total_matched = skills_top_n.length

      pets_top_n = pets_top_n.sort((a,b)=>b.score - a.score || b.stats_total - a.stats_total).slice(0,limit)
      skills_top_n = skills_top_n.sort((a,b)=>b.score - a.score).slice(0,limit)

      return{
        success: true,
        data: {
          system_description:system_info.description,  //体系描述
          pets_top_n, //适配精灵 Top N
          skills_top_n, //适配技能 Top N
          pet_total_matched,  //适配精灵总数
          skill_total_matched  //适配技能总数
        },
      }
    }

    //模式B
    if(pet_names){
      const pets_system_score = [] as any[];
      for (const system_name_item of SYSTEM_NAMES) {
        pets_system_score.push(pet_system_score(system_name_item,true,false,pet_names))
      }

      const result = pet_names.map(pn => ({
        pet_name: pn,
        systems: pets_system_score
          .map(arr => arr.find((r: any) => r.pet_name === pn))
          .filter(Boolean)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, 3)
      }))
            
      return {
        success: true,
        data: {
          pets_system:result,
        },
      }
    }

    //模式C
    if(skill_name){
      const result = SYSTEM_NAMES
        .flatMap(s => skill_system_score(s,true, skill_name))
        .sort((a, b) => b.score - a.score)

      if (result.length === 0) {
        return { success: true, data: { skills_system: [], note: "该技能不属于任何已定义体系" } }
      }

      return {
        success: true,
        data: {
          skills_system:result,
        },
      }
    }

    //模式E
    if(get_system_info){
      const system_info = cluster_definitions[get_system_info as System]
      return{
        success: true,
        data:{
          system_description:system_info.description,
          core_tags:system_info.core_tags,
          support_tags:system_info.support_tags,
        },
      }
    }

    return {
      success: false,
      error: {
        code: "MODE_NOT_SUPPORTED",
        message: "该参数组合暂不支持",
      },
    };

  },
  {
    name:"洛克王国体系分析",
    description:`
    当需要分析你的队伍的体系情况时，调用工具。

    暂定13种体系，分别为：
    ${ SYSTEM_NAMES.join(", ") }

    工具有五种查询模式可选：
    模式 A：只传 system → 返回该体系的说明 + 核心技能列表 + 适配精灵 Top N。

    模式 B：只传 pet_names → 返回每只精灵最适配的前 3 个体系（按适配度降序，无命中则为空数组）。

    模式 C：只传 skill_name → 这个技能属于哪些体系。

    模式 D：system + pet_names → 这支队伍在指定体系下的适配情况。

    模式 E：get_system_info → 传递体系名，查询体系的tags、描述等信息。

    工具接受5个参数，其中4个可选：
    system：体系名，可选，查询体系说明+核心技能+适配精灵
    pet_names：队伍中所有精灵的名字，数量为2-6
    skill_name：技能名，可选
    get_system_info：体系名，可选,用于仅查询某体系的信息
    limit：返回结果的数量，默认为10条，最大为20。仅模式A生效。

    返回结果：

    如果是模式A，返回：
      system_description:体系描述
      pets_top_n:适配精灵 Top N
      skills_top_n:适配技能 Top N
      pet_total_matched:适配精灵总数
      skill_total_matched:适配技能总数

    如果是模式B，返回：
      pets_system：{
        pet_name:精灵名称
        systems: [
          {
            system_name:体系名
            score:适配度
            is_core:是否命中该体系的核心机制
            core_tags:核心能力tag
            support_tags:配套能力tag
          }
        ]
      }
    
    如果是模式C，返回：
      skills_system：[
      {
          skill_name:技能名称,
          system_name:体系名,
          score:适配度,
          is_core:是否命中该体系的核心机制,
          core_tags:核心能力tag,
          support_tags:配套能力tag
      }
          ]

    如果是模式D，返回：
      pets_system：[
      {
          pet_name:精灵名称,
          system_name:体系名,
          score:适配度,
          is_core:是否命中该体系的核心机制,
          core_tags:核心能力tag,
          support_tags:配套能力tag
       }
          ]

    如果是模式E，返回：
      system_description:体系描述,
      core_tags:核心能力tag,
      support_tags:配套能力tag,

    
    关于is_core：是否命中该体系的核心机制。
        true  = 具备该体系赖以成立的关键能力（如灼烧体系能上灼烧），是真正的体系成员
        false = 只能提供配套能力（减伤/连击等），不具备核心机制，不算体系成员


    适用场景：
    1.当需要了解某个体系的信息、核心精灵、核心技能
    2.当需要了解队伍对所有体系的适配情况
    3.当需要了解队伍对指定体系的适配情况
    4.当需要了解指定技能适合哪些体系

    不适用场景：一切不涉及体系的问题


    `,
    schema: z.object({
      system: z.enum(SYSTEM_NAMES).optional(),
      pet_names: z.array(z.string()).min(2).max(6).optional(),
      skill_name: z.string().optional(),
      get_system_info: z.enum(SYSTEM_NAMES).optional(),
      limit: z.number().max(20).default(10),
    })

  }
)