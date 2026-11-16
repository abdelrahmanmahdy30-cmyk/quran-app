import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('components/plan/six-month-schedule.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

import re
matches = re.findall(r'.*شهور.*', c)
print('Found شهور:', matches)
matches2 = re.findall(r'.*أشهر.*', c)
print('Found أشهر:', len(matches2))
