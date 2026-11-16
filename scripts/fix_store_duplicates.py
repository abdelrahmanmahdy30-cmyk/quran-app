"""Remove duplicate storeRatePage/storeRatePages blocks from unified-plan-store.ts"""
import re

path = r'C:\Users\abdel\Desktop\v0-quran-memorization-website\lib\unified-plan-store.ts'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The duplicate block pattern: starts with the comment for SRS rating
# and includes both storeRatePage and storeRatePages definitions
# We'll find all occurrences and keep only the first

BLOCK_START_COMMENT = '/**\n * \u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u062a\u0633\u0645\u064a\u0639 \u0644\u0635\u0641\u062d\u0629 \u0645\u062d\u0641\u0648\u0638\u0629 (\u0627\u0644\u0645\u0631\u062d\u0644\u0629 4: SRS)'

# Split content by \r\n or \n
lines = content.splitlines(keepends=True)

# Find all line indices where storeRatePage export function starts
indices = []
for i, line in enumerate(lines):
    if 'export function storeRatePage(' in line:
        indices.append(i)

print(f"Found {len(indices)} occurrences of storeRatePage at lines: {[i+1 for i in indices]}")

if len(indices) <= 1:
    print("No duplicates found, nothing to do.")
    exit(0)

# Keep only the first occurrence. Remove duplicates.
# Each duplicate block is: comment (3 lines) + storeRatePage function + storeRatePages function
# We need to remove from the comment before each duplicate to end of storeRatePages

# Build new content keeping only lines before the 2nd occurrence's comment start
# Find where each duplicate's comment block starts (look back from function def)
def find_comment_start(lines, func_line_idx):
    """Go back from func_line_idx to find the /** comment start"""
    i = func_line_idx - 1
    while i >= 0:
        stripped = lines[i].strip()
        if stripped.startswith('/**'):
            return i
        if stripped == '' or stripped.startswith('*'):
            i -= 1
            continue
        # Hit something that's not part of the comment
        break
    return func_line_idx  # fallback: no comment found

# Find end of storeRatePages function after each storeRatePage
def find_function_end(lines, start_idx):
    """Find the closing brace of a function starting at start_idx"""
    depth = 0
    in_function = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        depth += line.count('{') - line.count('}')
        if depth > 0:
            in_function = True
        if in_function and depth == 0:
            return i
    return len(lines) - 1

# For each duplicate after the first, find the full block to remove
# storeRatePages always follows storeRatePage, so find storeRatePages end too
blocks_to_remove = []
for dup_idx in indices[1:]:
    # Find comment start
    comment_start = find_comment_start(lines, dup_idx)
    # Find end of storeRatePage
    rate_page_end = find_function_end(lines, dup_idx)
    # Find storeRatePages function start (should be right after)
    rate_pages_start = None
    for j in range(rate_page_end + 1, min(rate_page_end + 15, len(lines))):
        if 'export function storeRatePages(' in lines[j]:
            rate_pages_start = j
            break
    if rate_pages_start is not None:
        rate_pages_end = find_function_end(lines, rate_pages_start)
    else:
        rate_pages_end = rate_page_end
    
    # Skip any blank lines after
    end = rate_pages_end + 1
    while end < len(lines) and lines[end].strip() == '':
        end += 1
    
    blocks_to_remove.append((comment_start, end))
    print(f"Will remove lines {comment_start+1} to {end} (duplicate block)")

# Remove blocks in reverse order to preserve indices
for start, end in reversed(blocks_to_remove):
    del lines[start:end]

new_content = ''.join(lines)

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(new_content)

# Verify
with open(path, 'r', encoding='utf-8') as f:
    verify = f.read()

count = verify.count('export function storeRatePage(')
print(f"After fix: {count} occurrence(s) of storeRatePage")

lines_after = verify.splitlines()
print(f"File now has {len(lines_after)} lines")

