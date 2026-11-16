with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'let countForToday = studyDayIndex <= 139 ? 4 : 3;\n      if (monthKey === "2026-11" && (studyDayIndex === 25 || studyDayIndex === 26)) countForToday = 2;',
    'const countForToday = studyDayIndex <= 139 ? 4 : 3;'
)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Reverted perturbation 2')
