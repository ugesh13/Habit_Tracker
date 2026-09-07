---
name: Auto Git Push
description: Automatically commits and pushes changes to GitHub after completing tasks.
---

# Auto Git Push Rule

When you finish a task that involves making changes to the codebase, you **must automatically**:
1. Run `git add .`
2. Run `git commit -m "[Descriptive commit message]"`
3. Run `git push`

You do not need to ask for permission to do this unless the changes are massive or highly experimental. By default, push all successful changes to GitHub so that the Vercel deployment updates automatically.
