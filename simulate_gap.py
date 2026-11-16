import math

day_of_week = 0
current_page = 1
study_day_idx = 1
week_idx = 1

study_day_pages = {}
far_pointer = 0

stats = []

for cal_day in range(1, 182):
    is_friday = (day_of_week == 5)
    
    if is_friday:
        last_study = study_day_idx - 1
        near_pages = []
        if last_study >= 2:
            near_pages = study_day_pages.get(last_study - 1, []) + study_day_pages.get(last_study, [])
        elif last_study == 1:
            near_pages = study_day_pages.get(1, [])
        
        memorized_before = current_page - 1
        near_min = near_pages[0] if near_pages else memorized_before + 1
        eligible_far_max = max(0, near_min - 1)
        
        daily_far = math.ceil(eligible_far_max / 19) if eligible_far_max > 0 else 0
        from_far = (far_pointer % eligible_far_max) + 1 if eligible_far_max > 0 else 0
        to_far = min(eligible_far_max, from_far + daily_far - 1) if eligible_far_max > 0 else 0
        far_pages = list(range(from_far, to_far + 1)) if eligible_far_max > 0 else []
        far_pointer = 0 if to_far >= eligible_far_max else to_far
        
        # Friday reviews: week_pages + near_pages + far_pages
        # week_pages is everything memorized this week
        week_start_study = last_study - 5 if last_study >= 6 else 1
        week_pages = []
        for s in range(week_start_study, last_study + 1):
            week_pages.extend(study_day_pages.get(s, []))
            
        all_reviewed_today = set(week_pages + near_pages + far_pages)
        stats.append({
            'cal_day': cal_day, 'type': 'friday', 'day_num': week_idx,
            'new': [], 'reviewed': all_reviewed_today, 'far_pages': far_pages
        })
        week_idx += 1
    else:
        count_today = 4 if study_day_idx <= 139 else 3
        new_pages = list(range(current_page, min(605, current_page + count_today)))
        current_page = new_pages[-1] + 1
        study_day_pages[study_day_idx] = new_pages
        
        if study_day_idx == 1:
            near_pages = []
        elif study_day_idx == 2:
            near_pages = study_day_pages[1]
        else:
            near_pages = study_day_pages[study_day_idx - 2] + study_day_pages[study_day_idx - 1]
            
        memorized_before = new_pages[0] - 1
        near_min = near_pages[0] if near_pages else memorized_before + 1
        eligible_far_max = max(0, near_min - 1)
        
        daily_far = math.ceil(eligible_far_max / 19) if eligible_far_max > 0 else 0
        from_far = (far_pointer % eligible_far_max) + 1 if eligible_far_max > 0 else 0
        to_far = min(eligible_far_max, from_far + daily_far - 1) if eligible_far_max > 0 else 0
        far_pages = list(range(from_far, to_far + 1)) if eligible_far_max > 0 else []
        far_pointer = 0 if to_far >= eligible_far_max else to_far
        
        all_reviewed_today = set(near_pages + far_pages)
        stats.append({
            'cal_day': cal_day, 'type': 'study', 'study_idx': study_day_idx,
            'new': new_pages, 'reviewed': all_reviewed_today, 'far_pages': far_pages
        })
        study_day_idx += 1
        
    day_of_week = (day_of_week + 1) % 7

page_all_events = {p: [] for p in range(1, 605)}
for s in stats:
    cal_day = s['cal_day']
    # A page is encountered on the day it is newly memorized, or reviewed
    for p in s['new']:
        page_all_events[p].append(cal_day)
    for p in s['reviewed']:
        if not page_all_events[p] or page_all_events[p][-1] != cal_day:
            page_all_events[p].append(cal_day)

max_gap_all = 0
worst_page = 0
for p in range(1, 605):
    evs = page_all_events[p]
    for i in range(1, len(evs)):
        gap = evs[i] - evs[i-1]
        if gap > max_gap_all:
            max_gap_all = gap
            worst_page = p

print(f"Max gap considering all (new + near + friday + far): {max_gap_all} on page {worst_page}")

# What if considering only review-to-review or memory-to-review?
# What about test 6 in tests/six-month-plan.test.ts?
