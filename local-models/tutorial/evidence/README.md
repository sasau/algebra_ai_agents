# Ollama tutorial evidence

The doctor, smoke command and curl scripts save new timestamped files or folders. They do not overwrite earlier runs. Machine-specific results are ignored by Git; attach the immutable path printed by your run to a submission.

`npm test` uses scripted HTTP fixtures and does no inference. `npm run doctor` checks server, installation and local model metadata without inference. `npm run smoke` and either curl script make at most two actual model calls. Neither dispatches tools or tests an agent architecture. Complete architecture evidence comes from Practice 03.

The implementation's executed results, hardware and unexecuted platforms are recorded in [VALIDATION.md](../VALIDATION.md).
