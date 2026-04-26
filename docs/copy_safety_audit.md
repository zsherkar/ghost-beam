# Copy Safety Audit

Audit date: 2026-04-26

Scope: authored README/docs/source/scripts plus final legal and packaging files. Dependency folders, build output, backend generated artifacts, caches, temporary browser profiles, and generated artifact payloads were excluded from the text sweep.

## Terms Searched

- `MIT`
- `Apache`
- `GPL`
- `BSD`
- `AGPL`
- `MPL`
- `Creative Commons`
- `open source`
- `free to use`
- `permission granted`
- `real ALS data`
- `real EPICS writes`
- `live hardware`
- `public tunnel`
- `paid API`
- `auto-download BOOSTR`
- `real facility logs`
- `endorsed by`
- `affiliated with`
- `safety-certified`
- `production ready`
- `DECISIONRECORD`

## Findings and Assessment

### Open-source license terms

Matches for `MIT`, `Apache`, `GPL`, `BSD`, `AGPL`, `MPL`, and `Creative Commons` were limited to:

- `GITHUB_RELEASE_CHECKLIST.md`, where the checklist explicitly says to confirm those licenses are not present.
- False positives such as `LIMITATION`, `IMPLIED`, or `SETTING_LIMITS` in legal warranty text and source code identifiers.

Assessment:

- Safe. No open-source license grant was found.
- `LICENSE` is proprietary/all-rights-reserved.

### `open source`

Matches:

- `README.md`: "This repository is provided only for review and evaluation through GitHub. It is not open source."
- `docs/legal_notice.md`: "Ghost Beam is not open source. No license is granted."

Assessment:

- Safe. The matches are explicit negative/proprietary statements.

### `free to use`

No matches found.

Assessment:

- Safe.

### `permission granted`

No problematic matches found.

Assessment:

- Safe. The legal files state that no license or permission is granted.

### `real ALS data`

No README/source claim of real ALS data was found.

Assessment:

- Safe.

### `real EPICS writes`

Matches were found only in negative/disclosure contexts such as "does not perform real EPICS writes" and "real EPICS writes are forbidden."

Assessment:

- Safe. No claim that EPICS writes are enabled was found.

### `live hardware`

Matches were found only in negative/disclosure contexts such as "without live hardware."

Assessment:

- Safe.

### `public tunnel`

Matches were found only in negative/disclosure contexts such as "no public tunnels" or "does not open public tunnels."

Assessment:

- Safe.

### `paid API`

Matches were found only in negative/disclosure contexts such as "no paid APIs."

Assessment:

- Safe.

### `auto-download BOOSTR`

No matches found.

Assessment:

- Safe. README says BOOSTR is local-slice only and not bundled or downloaded.

### `real facility logs`

Matches were found only in negative/disclosure contexts such as "no real facility logs."

Assessment:

- Safe.

### `endorsed by` / `affiliated with`

Matches were found in README and legal notices, all phrased as "not affiliated with" or "not endorsed by."

Assessment:

- Safe. The README and legal notices make non-affiliation explicit.

### `safety-certified`

Matches were found in README, LICENSE, NOTICE, and legal notice, all phrased as "not safety-certified."

Assessment:

- Safe.

### `production ready`

No matches found.

Assessment:

- Safe.

### `DECISIONRECORD`

No user-facing `DECISIONRECORD JSON` label was found in README. Existing `DecisionRecord` references remain in code, API docs, schema titles, and type names where appropriate.

Assessment:

- Safe. Product-facing README uses `Decision Record`.

## README Media Audit

- All README image paths are repo-relative.
- Every README image path exists:
  - `docs/screenshots/final_guided_inline_dark.png`
  - `docs/screenshots/final_evidence_drawer.png`
  - `docs/screenshots/final_guided_inline_light.png`
- No GIF files are linked from README.
- README links to `docs/gifs/README.md` for future GIF capture instructions instead of linking missing GIFs.

## Legal File Audit

Required legal files exist:

- `LICENSE`
- `COPYRIGHT.md`
- `NOTICE.md`
- `CONTRIBUTING.md`
- `docs/legal_notice.md`

The legal position is proprietary/all-rights-reserved and does not grant an open-source license.

## Fixes Made

- Replaced README with final proprietary GitHub README.
- Added strict proprietary/all-rights-reserved legal files.
- Added GIF capture plan without adding missing GIF links.
- Added README visual plan.
- Added GitHub push command file that prepares commands but does not execute push.
