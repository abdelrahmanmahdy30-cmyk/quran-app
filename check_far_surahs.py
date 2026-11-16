import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/six-month-plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

study_days = {}
for m in plan:
    for d in m['days']:
        if d['type'] == 'study':
            study_days[d['dayNumber']] = d

def get_surah_range(pages):
    if not pages:
        return ""
    p_from = pages[0]['p']
    p_to = pages[-1]['p']
    first_s = pages[0]['s'][0]
    last_s = pages[-1]['s'][-1]
    return f"{first_s['n']} {first_s['f']} إلى {last_s['n']} {last_s['t']}"

for d_num in [1, 2, 3, 4, 5, 139, 140, 155]:
    d = study_days[d_num]
    far_p = d['farPages']
    if far_p:
        print(f"Day {d_num} Far (ص {far_p[0]['p']} إلى {far_p[-1]['p']}): {get_surah_range(far_p)}")
