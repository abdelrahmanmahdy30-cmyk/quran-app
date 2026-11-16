with open('lib/plan-generator.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Perturbation 3: تداخل بين القريبة والبعيدة
target = 'farCount = farPages.length;\n      }'
replacement = 'farCount = farPages.length;\n        if (nearPages.length > 0) farPages.push(nearPages[0]);\n      }'

c_p3 = c.replace(target, replacement, 1)
with open('lib/plan-generator.ts', 'w', encoding='utf-8') as f:
    f.write(c_p3)
print('Applied perturbation 3')
