---
name: verify-optional-lab
description: Run every implemented Optional case and its unit-test suite, reporting each layer separately.
---

Run python3 tools/run_case.py --all --check --tests. Read the actual build, Surefire
counts/package coverage and main RESULT comparisons. Require nonzero tests, zero
failures/errors/skips and an executed test class for every case package. Report
unit tests separately from main checks. Do not claim exhaustive correctness or
repair source/fixtures during this verification task.
