# Evidence is created during student execution

No checks have been run against a server in this starter kit: there is no
server yet. Each step creates evidence/step-NN/attempt-N/ with the verifier's
actual command transcript and verification.md. Retain failed attempts.
See workflow/checkpoints.md for the evidence format and acceptance rules.


Keep stdout/stderr byte-for-byte in `.txt` transcripts. Maven output may contain
trailing spaces; the checkpoint protocol excludes only these raw transcripts
from its whitespace gate. Review their contents before staging. Source, tests,
Markdown and structured evidence still require a clean whitespace check.
