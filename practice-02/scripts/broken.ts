import { runSelectedExercise } from '../exercises/selected.js';
import { evidence, entryError, requireValue } from './common.js';
const selected=process.argv[process.argv.indexOf('--case')+1];
const aliases:Record<string,string>={'path-prefix':'E03',symlink:'E03','command-injection':'E02',timeout:'E04',poisoning:'E08',stdout:'E09',oversize:'E11',injection:'E07'};
try {
  const id=aliases[selected]??selected;
  if(!id || !/^E(02|03|04|07|08|09|11)$/.test(id)) throw new Error('INVALID_INPUT: supply --case path-prefix, command-injection, timeout, injection, poisoning, stdout, oversize, or its E-number.');
  const result=requireValue(await runSelectedExercise(id,'reference'));
  await evidence(`broken-${id}`,result);console.log(JSON.stringify(result,null,2));
} catch(error) {entryError(error);}
