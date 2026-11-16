with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'if (studyDayIndex > 151) { cur.setDate(cur.getDate() + 1); continue; }\n      const countForToday = studyDayIndex <= 139 ? 4 : 3;',
    'const countForToday = studyDayIndex <= 139 ? 4 : 3;'
)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Reverted perturbation 1')
