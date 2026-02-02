import { createPatch } from 'diff';

export function generateDiff(oldContent: string, newContent: string, filePath?: string): string {
    const patch = createPatch(
        filePath || 'file',
        oldContent,
        newContent,
        '',
        ''
    );
    
    return patch;
}