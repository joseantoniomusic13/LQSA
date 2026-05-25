import os
import re

# Read characters.js
with open(r"c:\Users\Jose Antonio\Desktop\LQSA\characters.js", "r", encoding="utf-8") as f:
    content = f.read()

# Find all character names using regex
names = re.findall(r'nombre:\s*"([^"]+)"', content)

# Define toSlug logic in python
def to_slug(name):
    # normalize accents and lowercase
    import unicodedata
    name = name.lower()
    name = "".join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn')
    name = re.sub(r'[^a-z0-9]+', '-', name)
    name = name.strip('-')
    return name

# Map character names to slugs
char_slugs = {to_slug(name): name for name in names}

# List files in img/personajes
img_dir = r"c:\Users\Jose Antonio\Desktop\LQSA\img\personajes"
img_files = [f for f in os.listdir(img_dir) if f.endswith(".webp")]
img_slugs = {f[:-5]: f for f in img_files}

print("=== CHARACTERS IN characters.js BUT NO WEBP IMAGE ===")
missing_images = []
for slug, name in char_slugs.items():
    if slug not in img_slugs:
        missing_images.append((name, slug))
        print(f"- {name} (expected: {slug}.webp)")

print("\n=== WEBP IMAGES IN img/personajes BUT NO CHARACTER IN characters.js ===")
missing_characters = []
for slug, filename in img_slugs.items():
    if slug not in char_slugs:
        missing_characters.append((filename, slug))
        print(f"- {filename}")
