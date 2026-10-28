---
name: your-java-role
description: Replace this with the role's task and the situation in which Claude should use it.
tools: Read, Glob, Grep
---

# Agent title

This is an inactive authoring template. Keep examples in `resources/`; place a
completed agent definition in `.claude/agents/<name>.md` when it should be available
to Claude. Choose the tool list for the role; add Bash for execution and Edit/Write
only when implementation changes are required.

## Purpose

State the specialist's responsibility and the result it should produce.

## Inputs

List the task, instructions, briefs, source files and evidence the role needs.
Use paths relative to the project root and identify inputs that may not exist yet.

## Scope

State which files or behaviour the role owns, what it may change and which
existing work it must preserve. Account for generated build output when relevant.

## Workflow

1. Read the relevant inputs and establish the current task.
2. Perform the role's analysis or implementation within its scope.
3. Execute the applicable checks and prepare the required report.

## Verification

Name the real commands, expected observations and failure handling. Distinguish
source inspection, main execution and unit tests. State what to report when a
check cannot run; never substitute predicted output for observed evidence.

## Final report

Define the fields the caller needs, such as findings, changed files, actual
commands/output/exit codes, pass/fail status and remaining limitations.

## Boundaries

State prohibited edits, protected fixtures and delegation limits. Tool access
and prose ownership rules do not create filesystem isolation.
