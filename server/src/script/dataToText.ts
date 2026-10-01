export const petToText = (pet: any) => {
  return `
    精灵名称: ${pet.name}\n
    属性: ${pet.type_primary}\n
    生命: ${pet.stats.hp}\n
    物攻: ${pet.stats.atk}\n
    防御: ${pet.stats.defense}\n
    魔攻: ${pet.stats.sp_atk}\n
    魔抗: ${pet.stats.sp_def}\n
    速度: ${pet.stats.speed}\n
    种族值: ${pet.stats.total}\n
    特性: ${pet.ability}\n
    身高: ${pet.height}\n
    体重: ${pet.weight}\n
    介绍: ${pet.description}\n
    获取方式: ${pet?.evolution_chain[0]?.name ?? (pet.how_to_get ? "使用技能:" + pet.how_to_get : "未知")}\n
    技能: ${pet.skills.join(", ")}\n
    技能石: ${pet.stone_skills.join(", ")}\n
    血脉技能: ${pet.bloodline_skills.join(", ")}\n   
    `;
};

export const evolutionToText = (evolution: any) => {
  const { name, members, member_names, member_stats, apex_name, conditions } =
    evolution;

  const statLines: string[] = [];
  const statEntries = Object.entries(member_stats ?? {});

  member_names.forEach((_name: string, index: number) => {
    const stageNo = index + 1;
    const formId = members[index] ?? "未知编号";
    const entry = statEntries[index];
    const statVal = entry ? entry[1] : "未知";
    statLines.push(`第${stageNo}阶段编号为${formId}，种族值为${statVal}`);
  });

  const condLines: string[] = [];
  if (conditions) {
    const condEntries = Object.entries(conditions).sort((a, b) => {
      const numA = Number(a[0].replace(/[^0-9]/g, ""));
      const numB = Number(b[0].replace(/[^0-9]/g, ""));
      return numA - numB;
    });
    condEntries.forEach(([, levelStr], idx) => {
      const evolveStage = idx + 1;
      condLines.push(`第${evolveStage}阶进化需要等级达到${levelStr}`);
    });
  }

  return `
进化链: ${name}
共有${members.length}种形态
最强形态为: ${apex_name}
进化分支: ${member_names.join("——>")}
${statLines.join("\n")}
${condLines.length ? condLines.join("\n") : "进化条件：无"}
`;
};

export const skillToText = (skill: any) => {
  return `
    技能名称: ${skill.name}\n
    技能属性: ${skill.type}\n
    技能分类: ${skill.category}\n
    技能威力: ${skill.power}\n
    技能命中: ${skill.accuracy}\n
    技能消耗: ${skill.energy}\n
    技能描述: ${skill.effect}\n
    `;
}

export const BaiduBaikeRoco_to_text = (data: any) => {
  return `
     ${data.is_subsection ? ("所属章节：" + data.parent_chapter) : ""}\n
     ${data.title}：\n
     ${data.content}\n
  `
}