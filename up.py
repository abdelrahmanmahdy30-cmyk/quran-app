import codecs
TARGET = 'tests/six-month-plan.test.ts'
with codecs.open(TARGET, 'r', 'utf-8') as fh: content = fh.read()
content = content.replace('/ 15', '/ FAR_CYCLE_DAYS')
if 'FAR_CYCLE_DAYS' not in content: content = 'const FAR_CYCLE_DAYS = 19;\n\n' + content
with codecs.open(TARGET, 'w', 'utf-8') as fh: fh.write(content)
print('done, FAR_CYCLE_DAYS:', 'FAR_CYCLE_DAYS' in content, '/15 remain:', '/ 15' in content)
c=open('lib/plan-generator.ts','r',encoding='utf-8').read()
c=c.replace('const dailyFarCount = Math.max(2, Math.ceil(eligibleFarMax / 15));', 'const dailyFarCount = Math.ceil(eligibleFarMax / FAR_CYCLE_DAYS);')
c=c.replace('// دورة 15 يوماً تضمن مراجعة كل صفحة خلال أقل من 25 يوماً (أقل قطعاً من 30 يوماً)', '// دورة FAR_CYCLE_DAYS يوماً: ceil(القديم / FAR_CYCLE_DAYS) صفحة يومياً')
if 'FAR_CYCLE_DAYS' not in c: c = c.replace('export function generatePlan', 'const FAR_CYCLE_DAYS = 19;\n\nexport function generatePlan')
open('lib/plan-generator.ts','w',encoding='utf-8').write(c)
print('pg FAR_CYCLE_DAYS:', 'FAR_CYCLE_DAYS' in c, '| /19:', '/ FAR_CYCLE_DAYS' in c, '| /15:', '/ 15' in c)
c2=open('lib/plan-generator.ts','r',encoding='utf-8').read()
