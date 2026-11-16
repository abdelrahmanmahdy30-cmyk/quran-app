with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Perturbation 1: أيام الحفظ 151
c_p1 = c.replace(
    'const countForToday = studyDayIndex <= 139 ? 4 : 3;',
    'if (studyDayIndex > 151) { cur.setDate(cur.getDate() + 1); continue; }\n      const countForToday = studyDayIndex <= 139 ? 4 : 3;'
)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c_p1)
print('Applied perturbation 1')
