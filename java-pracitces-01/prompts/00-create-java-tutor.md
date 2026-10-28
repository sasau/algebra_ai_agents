Create our first specialist agent in .claude/agents/java-tutor.md.
Use resources/agent-template.md and the standard seven Markdown sections.
Its role is to explain and implement one Java Optional teaching step at a time.
Give it Read, Glob, Grep, Edit, Write and Bash; include name and description metadata.
It must obey the current stage: build, annotate, observe, compare or repair.
Building or annotating must not automatically run the program or compare expected results.
Observation must run the real JAR and trace output to code without opening expected/.
Expected-result checks compare observations without modifying code or fixtures.
Preserve earlier cases, defer JUnit until requested and do not delegate onward.
Read back the agent definition and explain its sections. Stop; do not create Java code.
