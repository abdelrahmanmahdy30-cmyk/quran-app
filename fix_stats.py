with open('app/stats/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(".toLocaleString('ar-SA')", ".toLocaleString('en-US')")

with open('app/stats/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated app/stats/page.tsx with Latin numbers!')
