with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('export const FAR_CYCLE_DAYS = 30;', 'export const FAR_CYCLE_DAYS = 19;')

with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Reverted perturbation 4')
