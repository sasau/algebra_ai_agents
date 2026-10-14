import { connect } from './client.js';
import { evidence, entryError } from './common.js';
const selected = process.argv[process.argv.indexOf('--server') + 1];
const server = selected === 'tickets' ? 'tickets' : 'workspace';
try {
  const client = await connect(server);
  try {
    const tools = await client.listTools();
    const resources = await client.listResources();
    const templates = await client.listResourceTemplates();
    const prompts = server === 'workspace' ? await client.listPrompts() : { prompts: [] };
    const manifest = await client.readResource({ uri: server === 'workspace' ? 'workspace://manifest' : 'tickets://schema' });
    const prompt = server === 'workspace' ? await client.getPrompt({ name: 'diagnose_test_failure', arguments: {} }) : undefined;
    const captured = { tools, resources, templates, prompts, manifest, prompt };
    await evidence(`${server}-discovery`, captured);
    console.log(JSON.stringify(captured, null, 2));
  } finally { await client.close(); }
} catch (error) { entryError(error); }
