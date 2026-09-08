---
name: auto-git-deploy
description: Automatically commit and push code changes to trigger Vercel deployments.
---

# Auto Git Deploy Rule

Whenever you (the AI) make any modifications, creations, or deletions to the codebase, you MUST automatically complete the following steps before ending your turn:
1. Run `git add .` to stage the changes.
2. Run `git commit -m "<brief description of changes>"` to commit them.
3. Run `git push` to push the changes to the remote repository.

This ensures that the user's Vercel deployment is always kept up-to-date with the latest AI-generated changes. You should perform this action proactively without asking for permission, unless the user explicitly requests you to hold off on pushing.
