Update .claude/agents/java-tutor.md; keep its seven sections and existing boundaries.
Make this a standing teaching rule for every future build or repair:
Add concise comments to non-obvious Java code and Maven settings you create or change.
Explain purpose, inputs/results, types, evaluation order and failures where relevant.
For Optional, explain present/empty paths and when callbacks run or are skipped.
Use concise JavaDoc for teaching classes/methods; avoid repeating obvious syntax.
Keep separate explanation prompts; observe/check stay read-only and never trigger repairs.
Show the agent-file diff and read back the rule. Change only this definition; do not run Java.
