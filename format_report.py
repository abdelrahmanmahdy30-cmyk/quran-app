import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('public/six-month-plan.json', 'r', encoding='utf-8') as f:
    plan = json.load(f)

study_days = {}
all_days = []
for m in plan:
    for d in m['days']:
        all_days.append(d)
        if d['type'] == 'study':
            study_days[d['dayNumber']] = d

def format_surahs(pages):
    if not pages:
        return "لا يوجد"
    
    # Collect all surahs & ayahs across the pages
    res = []
    for p in pages:
        p_num = p['p']
        s_parts = []
        for s in p['s']:
            if s['f'] == s['t']:
                s_parts.append(f"{s['n']} {s['f']}")
            else:
                s_parts.append(f"{s['n']} {s['f']}-{s['t']}")
        res.append(f"ص {p_num} ({' + '.join(s_parts)})")
    return "، ".join(res)

def format_surahs_condensed(pages):
    if not pages:
        return "لا يوجد"
    p_from = pages[0]['p']
    p_to = pages[-1]['p']
    first_s = pages[0]['s'][0]
    last_s = pages[-1]['s'][-1]
    return f"(ص {p_from} إلى {p_to}) {first_s['n']} {first_s['f']} إلى {last_s['n']} {last_s['t']}"

def format_day_output(d):
    day_num = d['dayNumber']
    day_name = d['dayName']
    date_str = d['date']
    
    new_p = d['newPages']
    new_str = format_surahs_condensed(new_p)
    
    near_p = d['nearPages']
    if not near_p:
        near_str = "لا يوجد"
    else:
        near_str = f"{format_surahs_condensed(near_p)} ({len(near_p)} صفحات)"
        
    far_p = d['farPages']
    if not far_p:
        far_str = "لا يوجد (0 صفحة)"
    else:
        p_from = far_p[0]['p']
        p_to = far_p[-1]['p']
        # If far_p wraps around
        if p_to < p_from:
            far_str = f"(ص {p_from} إلى {d['oldPagesCount']} ثم ص 1 إلى {p_to}) ({len(far_p)} صفحة)"
        else:
            far_str = f"(ص {p_from} إلى {p_to}) ({len(far_p)} صفحة)"
            
    print(f"يوم {day_num} | {day_name} {date_str}")
    print(f"- حفظ جديد: {new_str}")
    print(f"- مراجعة قريبة: {near_str}")
    print(f"- مراجعة بعيدة: {far_str}")
    print(f"- الحالة: ☐ لم يتم")
    print()

print("=== TABLE DAYS ===")
print("| اليوم | التاريخ | نوع اليوم | حفظ جديد | قريبة | بعيدة | المجموع |")
print("| :--- | :--- | :--- | :---: | :---: | :---: | :---: |")
for target in [1, 10, 30, 60, 100, 139, 155]:
    d = study_days[target]
    new_c = len(d['newPages'])
    near_c = len(d['nearPages'])
    far_c = len(d['farPages'])
    tot = new_c + near_c + far_c
    print(f"| يوم {target} | {d['date']} ({d['dayName']}) | حفظ | {new_c} | {near_c} | {far_c} | {tot} |")

# Find highest day
max_day = max(all_days, key=lambda d: len(d.get('newPages', [])) + len(d.get('nearPages', [])) + len(d.get('farPages', [])))
max_tot = len(max_day.get('newPages', [])) + len(max_day.get('nearPages', [])) + len(max_day.get('farPages', []))
print(f"\nأعلى يوم: {max_day['date']} ({max_day['dayName']}) - المجموع: {max_tot} صفحة (حفظ {len(max_day.get('newPages',[]))} + قريبة {len(max_day.get('nearPages',[]))} + بعيدة {len(max_day.get('farPages',[]))})")

print("\n=== DAYS DETAILS ===")
for target in [1, 2, 3, 4, 5, 139, 140, 155]:
    format_day_output(study_days[target])
