Create .claude/skills/check-optional-results/SKILL.md from the expected-result prompts.
Accept a case ID, read its expected RESULT lines and obtain fresh execution evidence.
Compare every RESULT line in order; permit other explanatory stdout.
Require exit code0 and empty stderr. Show actual/expected and the Java rule involved.
Do not edit source/fixtures or infer correctness from a code-to-output explanation.
Once available, tools/run_case.py caseNN --check performs the mechanical comparison.
Read back the skill and stop; we will invoke it in a separate prompt.
