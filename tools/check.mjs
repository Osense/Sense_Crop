import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const checks=['verify.cjs','verify-zip-time.cjs','verify-guides.cjs','verify-dimensions.cjs','verify-rotation.cjs','verify-output.cjs','verify-navigation.cjs','verify-correction.cjs','verify-correction-state.cjs','verify-auto-frames.cjs'];
for(const file of checks){const result=spawnSync(process.execPath,[file],{cwd,stdio:'inherit'});if(result.error){console.error(result.error);process.exit(1);}if(result.status!==0)process.exit(result.status||1);}
console.log('All checks passed.');
