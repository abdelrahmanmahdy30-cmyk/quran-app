import json

with open('public/six-month-plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

all_days = []
for m in plan:
    all_days.extend(m['days'])

# Find day for 2026-11-01
target_date = "2026-11-01"
target_idx = next(i for i, d in enumerate(all_days) if d['date'] == target_date)
print("Target day index:", target_idx, all_days[target_idx]['dayName'])

# First 7 days
week1 = all_days[0:7]
print("Week 1 days:")
for d in week1:
    print(f"  {d['date']} ({d['dayName']}) - type: {d['type']}")
