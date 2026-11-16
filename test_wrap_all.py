import math

for wrap_same_day in [False, True]:
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
            
            far_pages = []
            if eligible_far_max > 0:
                if not wrap_same_day:
                    from_far = (far_pointer % eligible_far_max) + 1
                    to_far = min(eligible_far_max, from_far + daily_far - 1)
                    far_pages = list(range(from_far, to_far + 1))
                    far_pointer = 0 if to_far >= eligible_far_max else to_far
                else:
                    for _ in range(daily_far):
                        p = (far_pointer % eligible_far_max) + 1
                        far_pages.append(p)
                        far_pointer = (far_pointer + 1) % eligible_far_max
            
            week_start_study = last_study - 5 if last_study >= 6 else 1
            week_pages = []
            for s in range(week_start_study, last_study + 1):
                week_pages.extend(study_day_pages.get(s, []))
                
            reviewed = set(week_pages + near_pages + far_pages)
            stats.append({'cal_day': cal_day, 'type': 'friday', 'reviewed': reviewed})
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
            
            far_pages = []
            if eligible_far_max > 0:
                if not wrap_same_day:
                    from_far = (far_pointer % eligible_far_max) + 1
                    to_far = min(eligible_far_max, from_far + daily_far - 1)
                    far_pages = list(range(from_far, to_far + 1))
                    far_pointer = 0 if to_far >= eligible_far_max else to_far
                else:
                    for _ in range(daily_far):
                        p = (far_pointer % eligible_far_max) + 1
                        far_pages.append(p)
                        far_pointer = (far_pointer + 1) % eligible_far_max
            
            reviewed = set(near_pages + far_pages)
            stats.append({'cal_day': cal_day, 'type': 'study', 'reviewed': reviewed})
            study_day_idx += 1
            
        day_of_week = (day_of_week + 1) % 7

    page_reviews = {p: [] for p in range(1, 605)}
    for s in stats:
        for p in s['reviewed']:
            page_reviews[p].append(s['cal_day'])
    max_all_gap = 0
    for p in range(1, 605):
        revs = page_reviews[p]
        for i in range(1, len(revs)):
            gap = revs[i] - revs[i-1]
            if gap > max_all_gap:
                max_all_gap = gap

    print(f"wrap_same_day = {wrap_same_day}: Max ALL gap = {max_all_gap}")
