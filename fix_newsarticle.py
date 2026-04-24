import re

# Your export order (16 columns):
# 0:id, 1:title, 2:slug, 3:summary, 4:sourceUrl, 5:imageUrl, 6:featured, 7:hidden, 8:body, 9:rssFeedId, 10:publishedAt, 11:createdAt, 12:updatedAt, 13:manual, 14:sourceLabel, 15:createdById

# Supabase order (16 columns):
# 0:id, 1:title, 2:slug, 3:summary, 4:sourceUrl, 5:sourceLabel, 6:imageUrl, 7:featured, 8:hidden, 9:manual, 10:body, 11:rssFeedId, 12:createdById, 13:publishedAt, 14:createdAt, 15:updatedAt

# Mapping: new position -> old position
# 0->0, 1->1, 2->2, 3->3, 4->4, 5->14, 6->5, 7->6, 8->7, 9->13, 10->8, 11->9, 12->15, 13->10, 14->11, 15->12

with open('import_newsarticle.sql', 'r') as f:
    lines = f.readlines()

output = []
for line in lines:
    # Extract VALUES content
    match = re.search(r"VALUES \((.+)\);", line)
    if not match:
        continue
    
    values_str = match.group(1)
    
    # Parse values (handle quoted strings with commas)
    values = []
    current = ""
    in_quotes = False
    for char in values_str:
        if char == "'" and (not current or current[-1] != "\\"):
            in_quotes = not in_quotes
        if char == "," and not in_quotes:
            values.append(current.strip())
            current = ""
        else:
            current += char
    values.append(current.strip())
    
    if len(values) != 16:
        print(f"Skipping line with {len(values)} values")
        continue
    
    # Reorder: old[0,1,2,3,4,14,5,6,7,13,8,9,15,10,11,12]
    new_order = [0,1,2,3,4,14,5,6,7,13,8,9,15,10,11,12]
    new_values = [values[i] for i in new_order]
    
    new_line = f'INSERT INTO "NewsArticle" VALUES ({", ".join(new_values)});'
    output.append(new_line)

with open('import_newsarticle_fixed.sql', 'w') as f:
    f.write("\n".join(output))

print(f"Fixed {len(output)} rows")
