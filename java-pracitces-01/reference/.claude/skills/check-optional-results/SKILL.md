---
name: check-optional-results
description: Compare real observed RESULT lines with fixed expected behaviour for one case.
---

Use the requested case ID and expected/caseNN.txt. Obtain fresh execution; use the
tool's --check mode when available. Compare every RESULT line exactly in order and
allow other explanatory stdout. Require exit0 and empty stderr. Explain each match
or mismatch using the Optional contract. Report untested inputs separately. Do not
change source or fixtures; a defect requires a separate repair prompt.
