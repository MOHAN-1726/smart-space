const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);

  console.log("🚀 STARTING COMPREHENSIVE LIVE SYSTEM TEST");
  console.log("==========================================================================");

  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const contexts = {};
  const pages = {};

  try {
    contexts.teacher = await browser.newContext();
    contexts.student = await browser.newContext();

    pages.teacher = await contexts.teacher.newPage();
    pages.student = await contexts.student.newPage();

    for (const role in pages) {
        pages[role].on('console', msg => console.log(`[${role.toUpperCase()}] ${msg.text()}`));
        pages[role].on('response', resp => {
            if (resp.url().includes('/api/')) console.log(`[${role.toUpperCase()}] API ${resp.status()} ${resp.url()}`);
        });
    }

    const prefix = Date.now().toString().slice(-4);
    const users = {
      teacher: { name: 'Teacher One', email: `teacher_${prefix}@test.com`, role: 'STAFF' },
      student: { name: 'Student One', email: `student_${prefix}@test.com`, role: 'STUDENT' },
    };

    async function register(page, user) {
      console.log(`📝 Registering ${user.name}...`);
      await page.goto('http://localhost:5173/login');
      if (await page.isVisible('text=Create Account')) await page.click('text=Create Account');
      await page.fill('input[name="name"]', user.name);
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', 'Password123!');
      await page.selectOption('select[name="role"]', user.role);
      await page.click('button[type="submit"]');
      await page.waitForSelector('text=Overview', { timeout: 30000 });
    }

    await register(pages.student, users.student);
    const studentId = await pages.student.evaluate(async () => (await (await fetch('/api/me')).json()).id);
    console.log(`🔍 Student ID: ${studentId}`);

    await register(pages.teacher, users.teacher);

    console.log("--- PHASE 4: Class Creation ---");
    const className = `Class ${prefix}`;
    await pages.teacher.click('button:text("Classes")');
    await pages.teacher.click('button:text("Create class")');
    await pages.teacher.fill('input[placeholder="Class name (required)"]', className);
    
    const createBtn = pages.teacher.locator('button', { hasText: 'Create' }).last();
    await createBtn.click({ force: true });

    await pages.teacher.waitForSelector(`text=${className}`, { timeout: 20000 });
    await pages.teacher.click(`text=${className}`);
    console.log(`🏫 Class ${className} opened.`);

    await pages.teacher.waitForSelector('text=Class code', { timeout: 10000 });
    const code = await pages.teacher.evaluate(() => {
        const labels = Array.from(document.querySelectorAll('span')).filter(s => s.innerText.includes('Class code'));
        if (labels.length === 0) return null;
        const container = labels[0].closest('div.bg-white');
        return container.querySelector('div.text-blue-600').innerText;
    });
    console.log(`🔑 Code: ${code}`);

    console.log("--- PHASE 4: Student Join ---");
    await pages.student.click('button:text("Classes")');
    await pages.student.click('button:text("Join class")');
    await pages.student.fill('input[placeholder="Class code"]', code);
    await pages.student.click('button:text("Join")', { force: true });
    
    console.log("⏳ Waiting for join success...");
    await pages.student.waitForTimeout(3000);
    
    let joined = false;
    for (let i = 0; i < 5; i++) {
        if (await pages.student.isVisible(`text=${className}`)) {
            joined = true;
            break;
        }
        console.log(`⏳ Attempt ${i+1}: Class not visible, reloading student page...`);
        await pages.student.reload();
        await pages.student.click('button:text("Classes")');
        await pages.student.waitForTimeout(2000);
    }
    
    if (!joined) throw new Error("Student failed to join class or class not visible");

    await pages.student.click(`text=${className}`);
    console.log("✅ Student joined and entered class.");

    console.log("--- PHASE 4: Attendance ---");
    await pages.teacher.click('button:text("Attendance")');
    await pages.teacher.fill('input[placeholder*="Description"]', 'Live Test Session');
    await pages.teacher.click('button:text("Start Session")', { force: true });
    
    await pages.teacher.waitForSelector('text=Live Test Session', { timeout: 10000 });
    await pages.teacher.click('text=Live Test Session');
    
    await pages.teacher.waitForSelector('select', { timeout: 10000 });
    await pages.teacher.selectOption('select', 'PRESENT');
    console.log("✅ Attendance marked.");

    console.log("🏆 LIVE SYSTEM TEST COMPLETED SUCCESSFULLY");
    await new Promise(r => setTimeout(r, 5000));

  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    for (const role in pages) {
      try {
        await pages[role].screenshot({ path: path.join(screenshotDir, `failure_${role}.png`) });
      } catch (e) {}
    }
  } finally {
    await browser.close();
  }
})();
