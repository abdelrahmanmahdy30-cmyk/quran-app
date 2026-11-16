with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

target = 'farCount = farPages.length;\n        if (nearPages.length > 0) farPages.push(nearPages[0]);\n      }'
replacement = 'farCount = farPages.length;\n      }'

c = c.replace(target, replacement, 1)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Reverted perturbation 3')
