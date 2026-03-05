# Skills Library

Personal Claude Code skills library — manage, version control, and deploy custom skills.

## Quick Start

```bash
# Create a new skill
./bin/sk create my-skill

# Edit the skill
$EDITOR skills/my-skill/SKILL.md

# Deploy all skills to Claude Code
./bin/sk deploy

# Verify in Claude Code
# /my-skill should now be available
```

## Commands

| Command | Description |
|---------|-------------|
| `./bin/sk deploy` | Symlink all skills → `~/.claude/skills/` |
| `./bin/sk undeploy` | Remove repo symlinks from `~/.claude/skills/` |
| `./bin/sk create <name>` | Scaffold new skill with SKILL.md template |
| `./bin/sk import <name>` | Import from SkillsMP via `agent-skills-cli` |
| `./bin/sk import-gh <url>` | Clone skill from GitHub URL |
| `./bin/sk list` | Show all skills + deployment status |

## Structure

```
skills/          # Custom skills (your own)
imported/        # Imported from SkillsMP or GitHub
bin/sk           # Management CLI
```

## How Deploy Works

Each skill directory gets symlinked individually into `~/.claude/skills/`. This means edits to skill files take effect immediately — you only need to re-deploy when adding new skills.

## Prerequisites

- `agent-skills-cli` — for importing from SkillsMP: `npm install -g agent-skills-cli`
- `gh` — for creating the GitHub repo (optional)
