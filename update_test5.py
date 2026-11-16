import codecs

with open('tests/six-month-plan.test.ts', 'r', encoding='utf-8') as f:
    c = f.read()

idx5 = c.find('it("5.')
idx6 = c.find('it("6.')

before = c[:idx5]
after = c[idx6:]

test5 = """  it("5. البعيدة تطابق ceil(القديم ÷ 19) كل يوم، بلا تداخل مع القريبة، ولا مراجعة لصفحة لم تُحفظ بعد، وتدوير منتظم", () => {
    allDays.forEach((day) => {
      const nearSet = new Set(day.nearPages.map((p) => p.p));

      // 1. لا تداخل إطلاقاً بين القريبة والبعيدة
      day.farPages.forEach((fp) => {
        expect(nearSet.has(fp.p)).toBe(false);
      });

      // 2. البعيدة تطابق ceil(القديم ÷ 19) كل يوم
      const expectedFarCount = day.oldPagesCount > 0 ? Math.ceil(day.oldPagesCount / 19) : 0;
      expect(day.farCount).toBe(expectedFarCount);
      expect(day.farPages.length).toBe(expectedFarCount);

      // 3. التتابع الدائري المنتظم ضمن المحفوظ القديم المؤهل
      const farPageNumbers = day.farPages.map((p) => p.p);
      for (let i = 1; i < farPageNumbers.length; i++) {
        expect(farPageNumbers[i]).toBe((farPageNumbers[i - 1] % day.oldPagesCount) + 1);
      }

      // 4. لا مراجعة لصفحة لم تحفظ بعد (كل الصفحات <= المحفوظ القديم المؤهل)
      day.farPages.forEach((fp) => {
        expect(fp.p).toBeLessThanOrEqual(day.oldPagesCount);
      });
    });
  });

  """

new_c = before + test5 + after
with open('tests/six-month-plan.test.ts', 'w', encoding='utf-8') as f:
    f.write(new_c)

print('Updated test 5 successfully!')
