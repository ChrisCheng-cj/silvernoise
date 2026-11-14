import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(import.meta.dirname,'../dist');
async function check(directory){for(const entry of await fs.readdir(directory,{withFileTypes:true})){if(entry.name==='.wrangler'||entry.name==='node_modules'||entry.name.endsWith('.pdf'))throw Error('Unexpected deployment file: '+path.join(directory,entry.name));if(entry.isDirectory())await check(path.join(directory,entry.name));}}
await check(output);
console.log('Deployment artifact contains no preview state or PDFs.');
