import json

with open('public/six-month-plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

for m in plan:
    for d in m['days']:
        if d.get('farCount') != len(d.get('farPages', [])):
            print('Mismatch farCount and len farPages:', d['date'], d['farCount'], len(d['farPages']))
        old_count = d.get('oldPagesCount', 0)
        expected = (old_count + 18) // 19 if old_count > 0 else 0
        actual = d.get('farCount', 0)
        if actual != expected:
            print(f"Date: {d['date']}, type: {d['type']}, oldPagesCount: {old_count}, expected: {expected}, actual: {actual}, farPages: {[p['p'] for p in d.get('farPages', [])]}")
