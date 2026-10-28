# Slide companion

Open [Java Practice01 — Optional](../../ai-agents/course-c/practices/practice-java01-optional-slides.html)
in the local course checkout, or use the course hub. The course is stored separately
from the published student repository, so the relative link is local-checkout only.

The deck and lesson READMEs follow the same staged conversation. Live path:
create java-tutor and Maven setup → case01 slowly → extract skills/CLI → cases 03/06
with the existing tooling → add and run JUnit → final verification.

The seven remaining cases are marked guided follow-up. Their lesson README
contains every copyable prompt and reference observation. Reference snippets on
slides are illustrative; student execution evidence must come from the current JAR.

## Optional introduction and API map

The deck now has122 pages. Slides8–16 introduce the missing-result problem,
contrast present/empty states, explain the full class declaration and cover all20
Java21 Optional public method declarations by purpose. Each method has its exact
signature and a small input/operation/result trace. See [OPTIONAL-API.md](OPTIONAL-API.md)
for a copyable reference and links to the later worked lessons. The live class
still builds cases01/03/06; the map is an orientation/reference rather than extra
implementation work.

## First specialist refinement

The former slide12 explanation step now starts at slide19, after the expanded
Optional introduction. Use its [copyable update prompt](prompts/01a-java-tutor-comments.md)
to persist useful comments and JavaDoc in java-tutor's teaching policy. Slide20
then applies a separate explanation prompt to the current Maven shell. Future
builds and repairs include comments by default; observation and expected checks
remain read-only. Students update their active definition; the example under
resources/agents/ is inactive comparison material.

## First example: task before prompt, results before comparison

Slide29 now states the case01 build goal in plain language with an input → method
→ outcome diagram. Slide30 contains the unchanged build prompt;31 explains the
code,32 is the student run and33 is Claude's run/source trace. Slide34 shows all
of `expected/case01.txt` and explains its purpose;35 contains the separate check
prompt. `case01` is a demo label/route, not a data file. The
[case01 lesson](lessons/01-creation/README.md) mirrors this sequence.
