import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database.js';

function prompt(query: string, hide = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    if (!hide) {
      rl.question(query, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    } else {
      // In terminal, masked input
      process.stdout.write(query);
      let text = '';
      const onData = (char: Buffer) => {
        const s = char.toString('utf-8');
        if (s === '\n' || s === '\r' || s === '\u0004') {
          process.stdin.removeListener('data', onData);
          rl.close();
          process.stdout.write('\n');
          resolve(text.trim());
        } else if (s === '\u0003') {
          process.exit();
        } else if (s === '\b' || s.charCodeAt(0) === 127) {
          if (text.length > 0) {
            text = text.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else {
          text += s;
          process.stdout.write('*');
        }
      };
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    }
  });
}

async function main() {
  console.log('\n=== CODE TO KNOW (碼上學) 系統管理員建立工具 ===\n');

  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;
  const envName = process.env.ADMIN_NAME;

  let email = envEmail;
  if (!email) {
    email = await prompt('請輸入管理員電子郵件 (Admin Email): ');
  }

  if (!email || !email.includes('@')) {
    console.error('錯誤：請輸入有效的電子郵件地址！');
    process.exit(1);
  }

  let displayName = envName;
  if (!displayName) {
    displayName = await prompt('請輸入管理員顯示名稱 (預設: 系統管理員): ');
    if (!displayName) displayName = '系統管理員';
  }

  let password = envPassword;
  if (!password) {
    password = await prompt('請輸入管理員密碼 (至少 8 碼，包含英數): ', false);
  }

  if (!password || password.length < 8) {
    console.error('錯誤：管理員密碼長度至少需 8 個字元！');
    process.exit(1);
  }

  // Ensure ADMIN and STUDENT roles exist
  let adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN', description: '系統管理員：平台全系統管理與權限配置' },
    });
  }

  let studentRole = await prisma.role.findUnique({ where: { name: 'STUDENT' } });
  if (!studentRole) {
    studentRole = await prisma.role.create({
      data: { name: 'STUDENT', description: '學生身分' },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Check if admin user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { roles: true },
  });

  if (existingUser) {
    console.log(`\n使用者 ${email} 已存在，正在賦予 ADMIN 角色並更新密碼...`);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        displayName,
        emailVerifiedAt: new Date(),
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: existingUser.id,
          roleId: adminRole.id,
        },
      },
      create: {
        userId: existingUser.id,
        roleId: adminRole.id,
      },
      update: {},
    });

    await prisma.auditLog.create({
      data: {
        userId: existingUser.id,
        action: 'ADMIN_ROLE_PROMOTED',
        details: JSON.stringify({ email, script: 'create-admin' }),
      },
    });

    console.log(`✅ 成功！帳號 ${email} 已升級為 ADMIN 管理員。`);
  } else {
    console.log(`\n建立全新管理員帳號 ${email}...`);
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName,
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        roles: {
          create: [
            { roleId: adminRole.id },
            { roleId: studentRole.id },
          ],
        },
        profile: {
          create: {
            nickname: displayName,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'ADMIN_INITIALIZED',
        details: JSON.stringify({ email, script: 'create-admin' }),
      },
    });

    console.log(`✅ 成功！已建立系統管理員：${email} (ID: ${newUser.id})`);
  }
}

main()
  .catch((e) => {
    console.error('執行失敗:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
