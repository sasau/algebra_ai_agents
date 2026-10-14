import { connect } from './client.js';
import { evidence, entryError } from './common.js';
try {
  const client = await connect('workspace');
  try {
    const tools = await client.listTools();
    const manifest = await client.readResource({ uri: 'workspace://manifest' });
    const value = { definitionUtf8Bytes: Buffer.byteLength(JSON.stringify(tools)),
      manifestUtf8Bytes: Buffer.byteLength(JSON.stringify(manifest)),
      tokenUsage: null, hostContext: null,
      explanation: 'Local byte counts are measured. No model tokens or host context were measured by this command. Optional tool:live records actual API usage; manually capture /context with conditions and versions.' };
    await evidence('local-size-measurement', value);
    console.log(JSON.stringify(value, null, 2));
  } finally { await client.close(); }
} catch (error) { entryError(error); }
