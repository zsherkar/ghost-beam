# Ghost Beam GitHub Push Commands

Run these manually only after reviewing README and legal files.

Do not run these commands until you are ready to publish the local repository state to GitHub.

## Current Local Git Context

- Current branch observed during packaging: `master`
- `git remote -v` returned no configured remotes in this local checkout.
- Intended repository: `https://github.com/zsherkar/ghost-beam`

Because no remote was configured locally, do not push until the remote is reviewed and added intentionally.

## Review Commands

```powershell
cd "D:\Building\Ghost Beam"
git status --short
git branch --show-current
git remote -v
```

## If Remote Is Missing

Review first, then run manually only if correct:

```powershell
git remote add origin https://github.com/zsherkar/ghost-beam.git
git remote -v
```

## Suggested Staging Commands

Minimal final README/legal/docs staging:

```powershell
git add README.md LICENSE COPYRIGHT.md NOTICE.md CONTRIBUTING.md docs/legal_notice.md docs/readme_visual_plan.md docs/gifs/README.md GITHUB_PUSH_COMMANDS.md GITHUB_RELEASE_CHECKLIST.md docs/copy_safety_audit.md Updates.md
```

If publishing the full release-candidate prototype, also stage the backend/frontend/data/docs/scripts files from the prior feature passes after reviewing them:

```powershell
git add backend frontend docs scripts packaging README_DRAFT_INPUTS.md README_FINAL_OUTLINE.md DEMO_ASSET_PACKET.md VISUAL_ASSET_INVENTORY.md
```

Do not stage:

```text
.env
.venv/
node_modules/
__pycache__/
.pytest_cache/
.tmp/
.tmp-chrome-qa*/
.npm-cache/
.pip-cache/
frontend/dist/
*.log
full public datasets
secrets
```

## Commit

```powershell
git status --short
git commit -m "docs: finalize Ghost Beam README and proprietary release materials"
```

## Push

Only after reviewing the commit:

```powershell
git push origin master
```

If the release branch should be renamed to `main`, do that intentionally in a separate reviewed step.
