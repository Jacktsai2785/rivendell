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

## Using Skills in Other Projects

Skills deploy 後是**全域生效**的，不需要在每個專案裡做任何設定。

### Step 1: Deploy（只需做一次）

在本 repo 目錄下執行：

```bash
cd ~/Documents/Projects/skills-test
./bin/sk deploy
```

這會把每個 skill 目錄 symlink 到 `~/.claude/skills/`，例如：

```
~/.claude/skills/setup-permissions → ~/Documents/Projects/skills-test/skills/setup-permissions/
```

### Step 2: 在任意專案中使用

開啟任何專案的 Claude Code，直接輸入 `/skill-name` 即可調用：

```
cd ~/some-other-project
claude

# 在 Claude Code 中輸入：
/setup-permissions
```

Claude Code 啟動時會自動掃描 `~/.claude/skills/` 下所有 skill。

### 常見情境

| 情境 | 做法 |
|------|------|
| 新增 skill 後其他專案看不到 | 回到本 repo 執行 `./bin/sk deploy` |
| 修改現有 skill 的內容 | 直接編輯 `skills/<name>/SKILL.md`，因為是 symlink 所以**立即生效** |
| 想確認哪些 skill 已部署 | `./bin/sk list` |
| 想暫時移除所有 skill | `./bin/sk undeploy` |
| 換了電腦 / 重新 clone | `git clone` 後執行 `./bin/sk deploy` 即可恢復 |

### 注意事項

- Skill 檔案必須命名為 `SKILL.md`，放在 skill 目錄的根層
- `user_invocable: true`（在 SKILL.md front matter 中）才能用 `/name` 斜線指令調用
- 如果 `user_invocable` 設為 `false` 或未設定，skill 仍會被載入但只能由 Claude 自動觸發（根據 description 匹配）
- Deploy 後需要**重啟 Claude Code** 才會偵測到新 skill

## Prerequisites

- `agent-skills-cli` — for importing from SkillsMP: `npm install -g agent-skills-cli`
- `gh` — for creating the GitHub repo (optional)
