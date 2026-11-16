with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Make day 25 and day 26 have 2 pages each so November totalPages = 100
c_p2 = c.replace(
    'let countForToday = studyDayIndex <= 139 ? 4 : 3;\n      if (monthKey === "2026-11" && studyDayIndex === 26) countForToday = 0;',
    'let countForToday = studyDayIndex <= 139 ? 4 : 3;\n      if (monthKey === "2026-11" && (studyDayIndex === 25 || studyDayIndex === 26)) countForToday = 2;'
)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c_p2)
print('Applied November 100 pages perturbation')
