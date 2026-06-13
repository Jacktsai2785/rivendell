# Skills Library — Project Rules

## Post-change rule

After any skill change (add, remove, rename, modify description/trigger), update `README.md` to keep the Skills Catalog table in sync:
- Skill name, trigger method, and description must match the SKILL.md frontmatter
- Update the skill count in the "Skills Catalog" heading and the Structure tree
- If a new category is added, add it to both the Structure tree and a new table section

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke gstack-office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke gstack-investigate
- Ship, deploy, push, create PR → invoke gstack-ship
- QA, test the site, find bugs → invoke gstack-qa
- Code review, check my diff → invoke gstack-review
- Update docs after shipping → invoke gstack-document-release
- Weekly retro → invoke gstack-retro
- Design system, brand → invoke gstack-design-consultation
- Visual audit, design polish → invoke gstack-design-review
- Architecture review → invoke gstack-plan-eng-review
- DX audit, "test the onboarding", "try the getting started" → invoke devex-review
- DX plan review, "API design review", "developer experience audit" → invoke plan-devex-review
- Open browser, "launch chrome", "real browser", AI browser control → invoke open-gstack-browser
