Extend tools/run_case.py with --tests, allowed only with --all --check.
Run clean verify instead of skipping tests, then check every implemented main.
Read Surefire XML; require nonzero tests, zero failures/errors/skips and tests in every case package.
Create a project-local verify-optional-lab skill for that final procedure.
Keep run-and-trace, expected-result checks and unit-test evidence distinct in the report.
Stop after creating the tool update and skill; do not run final verification yet.
