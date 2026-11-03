import { prisma } from '../src/config/database.js';

const ROLES = [
  { name: 'STUDENT', description: '學生：可參與課程、題庫練習、模擬測驗及 AI 學習助教' },
  { name: 'TEACHER', description: '教師：可管理班級、建立作業、發布測驗與檢視學習分析' },
  { name: 'ADMIN', description: '管理員：平台全系統管理、審核教師身分及安全稽核' },
];

async function main() {
  console.log('Seeding initial roles...');

  for (const role of ROLES) {
    const upserted = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
      },
    });
    console.log(`- Role synced: ${upserted.name} (${upserted.id})`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
