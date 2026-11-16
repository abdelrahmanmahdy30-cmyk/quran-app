import json

# Check farPages only gap
from simulate import stats

page_reviews = {p: [] for p in range(1, 605)}
for s in stats:
    for p in s['far_pages']:
        page_reviews[p].append(s['cal_day'])

max_gap = 0
violations = []
for p in range(1, 605):
    revs = page_reviews[p]
    for i in range(1, len(revs)):
        gap = revs[i] - revs[i-1]
        if gap > max_gap:
            max_gap = gap
        if gap > 30:
            violations.append((p, gap, revs[i-1], revs[i]))

print('Violations count:', len(violations))
print('First 10 violations:', violations[:10])
