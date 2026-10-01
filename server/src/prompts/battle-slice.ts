import { readFileSync } from "node:fs";


//战斗机制手册：按 ## 切成章节，第一个 ## 之前是文档标题，直接丢弃
const battleRulesDoc = readFileSync(
  new URL("../prompts/battle-rules.md", import.meta.url),
  "utf-8",
)

//检索部分，供工具使用
export const RULE_SECTIONS: Record<string, string> = Object.fromEntries(
  battleRulesDoc
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const lineEnd = block.indexOf("\n")
      return [block.slice(0, lineEnd).trim(), block.slice(lineEnd + 1).trim()]
    }),
)

//常驻部分，供 systemPrompt 使用，不作为可检索章节
export const battleRulesAlwaysOn = RULE_SECTIONS["常驻要点"]


//可检索章节，与 battle-rules.md 里的 ## 标题完全一致,用来限制模型能检索的内容
export const SECTION_NAMES = [
  "属性克制",
  "伤害计算",
  "种族值与属性公式",
  "性格",
  "天分与培养",
  "觉醒",
  "技能系统",
  "异常状态",
  "印记系统",
  "血脉系统",
  "精灵特性",
  "能量与魔力值",
  "对战规则与赛季",
] as const

//检查md章节是否和模型能够输出的章节名称一致
const missingSections = ["常驻要点", ...SECTION_NAMES].filter(
  (name) => !RULE_SECTIONS[name],
)

//不一致直接报错
if (missingSections.length) {
  throw new Error(
    `battle-rules.md 缺少章节：${missingSections.join("、")}。请检查 ## 标题与 SECTION_NAMES 是否一致`,
  )
}