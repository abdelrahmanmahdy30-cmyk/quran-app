with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Perturbation 2: نوفمبر 100 صفحة (بدلاً من 104)
c_p2 = c.replace(
    'const countForToday = studyDayIndex <= 139 ? 4 : 3;',
    'let countForToday = studyDayIndex <= 139 ? 4 : 3;\n      if (monthKey === "2026-11" && studyDayIndex === 26) countForToday = 0;'
)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c_p2)
print('Applied perturbation 2')
