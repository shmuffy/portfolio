# Christian Kim — Portfolio

Personal portfolio built in the **micrographics** design style.  
Dark electric palette · Circuit-board micro-patterns · LDR-inspired loading animation.

---

## How to push to GitHub

Open **Terminal** (Mac) or **Command Prompt / Git Bash** (Windows), then run these commands one by one:

```bash
# 1. Navigate to this folder
cd ~/Desktop/micrographics

# 2. Initialize git (skip if already initialized)
git init

# 3. Add the GitHub remote
git remote add origin https://github.com/shmuffy/portfolio.git

# 4. Stage all files
git add .

# 5. Commit
git commit -m "feat: initial portfolio — micrographics design system"

# 6. Push (set main branch)
git push -u origin main
```

> If you get a "repository already exists" error on step 3, skip it and go to step 4.

---

## Enable GitHub Pages

1. Go to **github.com/shmuffy/portfolio**
2. Click **Settings → Pages**
3. Under *Source*, select **Deploy from a branch**
4. Choose branch: **main** · folder: **/ (root)**
5. Click **Save**

Your site will be live at: **https://shmuffy.github.io/portfolio**

---

## File structure

```
portfolio/
├── index.html          # Single-page site
├── css/
│   └── style.css       # Full design system (tokens, layout, animations)
├── js/
│   ├── loader.js       # Canvas loading animation (LDR-inspired)
│   └── main.js         # Cursor, hero canvas, scroll reveals, tilt
└── README.md
```

---

## Customization

- **Name / role** → edit the `<h1>` in `index.html` and the loader text constants in `loader.js`  
- **Projects** → update the three `.project-card` sections and the inline SVG schematics  
- **Color** → change `--accent` in `css/style.css` `:root` (currently `#00FFB2` electric teal)  
- **LinkedIn URL** → update `href` in the contact section  
