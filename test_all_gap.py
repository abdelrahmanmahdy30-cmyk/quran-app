from simulate import stats

# Let's check:
# 1) What are the review days for each page when including nearPages, weekPages, and farPages?
page_reviews = {p: [] for p in range(1, 605)}

for s in stats:
    cal_day = s['cal_day']
    reviewed_pages = set()
    # Far pages
    for p in s['far_pages']:
        reviewed_pages.add(p)
    # Near pages
    # Let's get nearPages and weekPages from actual simulation
