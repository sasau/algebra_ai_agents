We have repeated real execution and code-to-output explanations for hello and case01.
Create .claude/skills/run-optional-case/SKILL.md from those observation prompts.
Accept a case ID; rebuild, launch its real JAR and capture stdout/stderr/exit code.
Read the current source and map important output lines to code and Optional states.
Do not read expected/, compare correctness or repair source in this observation skill.
Once available, tools/run_case.py caseNN --observe can perform mechanical execution.
Read back the skill and explain the boundary. Stop; do not invoke it yet.
