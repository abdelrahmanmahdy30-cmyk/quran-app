import json

# Let's inspect allDays from public/six-month-plan.json or generatePlan
with open('public/six-month-plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

all_days = []
for m in plan:
    all_days.extend(m['days'])

print('Total days:', len(all_days))

page_review_days = {p: [] for p in range(1, 605)}

for cal_day_idx, day in enumerate(all_days):
    cal_day_num = cal_day_idx + 1
    
    # Collect all reviewed pages for today: (قريبة أو أسبوعية أو بعيدة)
    # Note: on study days: nearPages, farPages.
    # on friday: weekPages, nearPages, farPages.
    today_pages = set()
    for p in day.get('farPages', []):
        today_pages.add(p['p'])
    for p in day.get('nearPages', []):
        today_pages.add(p['p'])
    if day.get('type') == 'friday':
        for p in day.get('weekPages', []):
            today_pages.add(p['p'])
            
    for p in today_pages:
        page_review_days[p].append(cal_day_num)

max_gap = 0
violations = []
for p in range(1, 605):
    revs = page_review_days[p]
    for i in range(1, len(revs)):
        gap = revs[i] - revs[i-1]
        if gap > max_gap:
            max_gap = gap
        if gap > 30:
            violations.append((p, gap, revs[i-1], revs[i]))

print('Max gap (review to review):', max_gap)
print('Violations count:', len(violations))
if violations:
    print('Violations:', violations)
