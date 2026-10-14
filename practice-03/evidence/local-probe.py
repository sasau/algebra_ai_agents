import json, platform, time, urllib.request
from pathlib import Path

endpoint = 'http://127.0.0.1:11434/api/chat'
models = ['qwen2.5:3b', 'llama3.2:latest']
results = []
for model in models:
    payload = {
        'model': model, 'stream': False, 'think': False,
        'options': {'temperature': 0, 'num_ctx': 8192, 'num_predict': 512},
        'messages': [
            {'role': 'system', 'content': 'You are a coding explorer. Call exactly one tool per turn. First read src/slugify.ts. Do not answer from memory.'},
            {'role': 'user', 'content': 'Inspect the supplied slugify function so its punctuation failure can be diagnosed.'},
        ],
        'tools': [{'type': 'function', 'function': {'name': 'read_file', 'description': 'Read the bounded project file.', 'parameters': {'type': 'object', 'properties': {'path': {'type': 'string'}}, 'required': ['path'], 'additionalProperties': False}}}],
    }
    started = time.perf_counter()
    try:
        request = urllib.request.Request(endpoint, json.dumps(payload).encode(), {'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=90) as response:
            output = json.load(response)
        results.append({'model': model, 'wall_seconds': round(time.perf_counter()-started,3), 'request': payload, 'response': output})
    except Exception as error:
        results.append({'model': model, 'wall_seconds': round(time.perf_counter()-started,3), 'error': str(error)})
    print(json.dumps({'model': model, 'result': results[-1].get('response', results[-1]).get('message', results[-1])}), flush=True)
Path(__file__).with_name('local-probe.json').write_text(json.dumps({'date': '2026-10-14', 'hardware': 'Apple M4 Max; 128 GiB unified memory; macOS 26.7.1; arm64', 'server': 'Ollama 0.40.3', 'inference': 'real local; no Authorization header; no provider credentials read', 'results': results}, indent=2)+'\n')
