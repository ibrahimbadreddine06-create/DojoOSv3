import * as fs from 'fs';
import * as path from 'path';

const files = [
    'package.json',
    'shared/schema.ts',
    'server/routes.ts',
    'server/storage.ts',
    'client/src/App.tsx',
    'client/src/contexts/theme-context.tsx',
    'client/src/lib/queryClient.ts'
];

let output = 'Dojo OS - Core Architecture Context\n\nThis document contains the critical files needed to understand the application architecture, routing, and database schema. Use this to safely integrate the AI chat feature without breaking the existing Vite/React/TanStack Query setup.\n\n';

for (const file of files) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        output += '==================================================\n';
        output += 'FILE: ' + file + '\n';
        output += '==================================================\n\n';
        output += content + '\n\n';
    } else {
        output += 'File not found: ' + file + '\n\n';
    }
}

fs.writeFileSync('dojo_os_ai_context.txt', output);
console.log('Successfully generated dojo_os_ai_context.txt');
