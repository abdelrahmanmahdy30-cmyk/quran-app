with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Perturbation 4: دورة 30 بدل 19
c_p4 = c.replace('export const FAR_CYCLE_DAYS = 19;', 'export const FAR_CYCLE_DAYS = 30;')

with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c_p4)
print('Applied perturbation 4')
