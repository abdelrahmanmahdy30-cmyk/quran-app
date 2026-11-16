import codecs

with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace Friday far review block
friday_target = """      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        // دورة FAR_CYCLE_DAYS يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        const fromFar = (farReviewPointer % eligibleFarMax) + 1;
        const toFar = Math.min(eligibleFarMax, fromFar + dailyFarCount - 1);
        for (let p = fromFar; p <= toFar; p++) {
          farPages.push(getPageEntry(p));
        }
        farCount = farPages.length;
        farReviewPointer = toFar >= eligibleFarMax ? 0 : toFar;
      }"""

friday_replacement = """      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        // دورة FAR_CYCLE_DAYS (19) يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً مع التدوير عند نهاية المحفوظ القديم
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = (farReviewPointer % eligibleFarMax) + 1;
          farPages.push(getPageEntry(p));
          farReviewPointer = (farReviewPointer + 1) % eligibleFarMax;
        }
        farCount = farPages.length;
      }"""

# Replace study day far review block
study_target = """      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        const fromFar = (farReviewPointer % eligibleFarMax) + 1;
        const toFar = Math.min(eligibleFarMax, fromFar + dailyFarCount - 1);
        for (let p = fromFar; p <= toFar; p++) {
          farPages.push(getPageEntry(p));
        }
        farCount = farPages.length;
        farReviewPointer = toFar >= eligibleFarMax ? 0 : toFar;
      }"""

study_replacement = """      const farPages: PageEntry[] = [];
      let farCount = 0;
      if (eligibleFarMax > 0) {
        // دورة FAR_CYCLE_DAYS (19) يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً مع التدوير عند نهاية المحفوظ القديم
        const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);
        for (let i = 0; i < dailyFarCount; i++) {
          const p = (farReviewPointer % eligibleFarMax) + 1;
          farPages.push(getPageEntry(p));
          farReviewPointer = (farReviewPointer + 1) % eligibleFarMax;
        }
        farCount = farPages.length;
      }"""

c = c.replace(friday_target, friday_replacement, 1)
c = c.replace(study_target, study_replacement, 1)

with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated lib/plan-generator.ts successfully!')
