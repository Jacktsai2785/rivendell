#!/usr/bin/env bash
# Hook: UserPromptSubmit
# Purpose: Reminds Claude to evaluate if anything should be logged to .learnings/
# Input: JSON on stdin (Claude Code hook payload)
# Output: Plain text reminder to stdout

# Read and discard stdin (required by hook protocol)
cat > /dev/null

cat <<'EOF'
[Self-Improvement Reminder] After completing this task, evaluate if anything should be logged to .learnings/:
- Did a command fail? → .learnings/ERRORS.md
- Did the user correct you? → .learnings/LEARNINGS.md (category: correction)
- Was your knowledge outdated? → .learnings/LEARNINGS.md (category: knowledge_gap)
- Did you find a better approach? → .learnings/LEARNINGS.md (category: best_practice)
- Did the user request a missing capability? → .learnings/FEATURE_REQUESTS.md
Use the self-improving-agent skill format. Create .learnings/ directory if it doesn't exist.
EOF
