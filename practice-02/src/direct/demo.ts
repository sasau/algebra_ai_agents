import { Workspace } from '../core/workspace.js';
import { evidence, entryError } from '../../scripts/common.js';
try {
  const workspace = await Workspace.create();
  const observations = [];
  for (const path of ['src/tokenizer.ts', 'src/missing.ts', '../outside/CANARY.txt']) {
    const result = await workspace.readFile({ path });
    observations.push({ call: { name: 'read_file', path }, result });
    console.log(JSON.stringify(observations.at(-1), null, 2));
  }
  await evidence('direct-tool', observations);
  if (observations.some(row => !row.result.ok && row.result.error.code === 'NOT_IMPLEMENTED')) {
    console.log('INCOMPLETE: finish TODO 1 and TODO 2. Instructor reference: LAB_VARIANT=reference npm run tool:demo');
    process.exitCode = 2;
  }
} catch (error) { entryError(error); }
