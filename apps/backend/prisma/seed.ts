import { PrismaClient } from '@prisma/client';
import { PREDEFINED_QUESTS, PREDEFINED_BADGES } from '@dydyd/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed predefined quests
  console.log('📜 Seeding quests...');
  for (const quest of PREDEFINED_QUESTS) {
    await prisma.quest.upsert({
      where: {
        id: `quest-${quest.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {
        name: quest.name,
        description: quest.description,
        category: quest.category,
        frequency: quest.frequency,
        baseXP: quest.baseXP,
        maxCompletionsPerPeriod: quest.maxCompletionsPerPeriod,
        isDefault: quest.isDefault,
        isCustom: quest.isCustom,
        iconName: quest.iconName,
        healthDataType: quest.healthDataType,
        targetValue: quest.targetValue,
        unit: quest.unit,
      },
      create: {
        id: `quest-${quest.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: quest.name,
        description: quest.description,
        category: quest.category,
        frequency: quest.frequency,
        baseXP: quest.baseXP,
        maxCompletionsPerPeriod: quest.maxCompletionsPerPeriod,
        isDefault: quest.isDefault,
        isCustom: quest.isCustom,
        iconName: quest.iconName,
        healthDataType: quest.healthDataType,
        targetValue: quest.targetValue,
        unit: quest.unit,
      },
    });
  }
  console.log(`✅ Seeded ${PREDEFINED_QUESTS.length} quests`);

  // Seed predefined badges
  console.log('🏆 Seeding badges...');
  for (const badge of PREDEFINED_BADGES) {
    await prisma.badge.upsert({
      where: {
        name: badge.name,
      },
      update: {
        description: badge.description,
        iconName: badge.iconName,
        type: badge.type,
        requirementType: badge.requirement.type,
        requirementValue: badge.requirement.value,
        requirementCategory: badge.requirement.category,
        requirementQuestId: badge.requirement.questId,
        xpBonus: badge.xpBonus,
        rarity: badge.rarity,
      },
      create: {
        name: badge.name,
        description: badge.description,
        iconName: badge.iconName,
        type: badge.type,
        requirementType: badge.requirement.type,
        requirementValue: badge.requirement.value,
        requirementCategory: badge.requirement.category,
        requirementQuestId: badge.requirement.questId,
        xpBonus: badge.xpBonus,
        rarity: badge.rarity,
      },
    });
  }
  console.log(`✅ Seeded ${PREDEFINED_BADGES.length} badges`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
