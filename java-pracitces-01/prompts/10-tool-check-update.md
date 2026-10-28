Extend tools/run_case.py with an explicit --check mode, separate from --observe.
In check mode, read expected/caseNN.txt and compare all RESULT lines exactly in order.
Keep full stdout in evidence and allow additional explanatory lines.
Fail on missing/extra/different result lines, nonzero exit or nonempty stderr.
Observation mode must still work without any expected file and must not claim a match.
Update run-optional-case and check-optional-results to call the corresponding modes.
Read back the changes. Stop; run and check the tool through separate prompts next.
