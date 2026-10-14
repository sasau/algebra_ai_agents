# Run evidence

`doctor` records server availability and model installation without inference. `probe` records one actual native Ollama call, including its request and native response. `verify:practice-03` records the separate full-lab actual inference result.

Scripts save immutable timestamped JSON evidence and a latest alias (`doctor.json`, `probe.json`, `verify-practice-03.json`). Save the immutable path printed by a command in your submission. Generated JSON/logs are ignored by Git to avoid committing machine-specific results; they remain on disk. Tests use mock transports and do not write files claiming inference.
