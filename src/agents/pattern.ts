import { AIClient } from '../ai';
import { DBClient } from '../db';
import notifier from 'node-notifier';

export default async function patternAgent(ai: AIClient, db: DBClient) {
    const filesData = db.getPatternAgentData(10);
    const notepad = db.getNotepad();
    if (filesData.length === 0) {
        console.log('No files data found for pattern analysis.');
        return;
    }
    const prompt = `
You are an assistant that scans recent code changes (diffs + AI summaries) and writes a single concise natural-language observation ("note") capturing any recurring pattern, code smell, or helpful insight the developer should know.
You MUST return ONLY valid JSON (no prose) that exactly matches the schema shown below. Do NOT include any extra commentary.
Files Data:
${filesData.map(file => `
File Path: ${file.filePath}
Diff:
${file.diff || 'No diff available'}

AI Summary of Changes:
${file.ai_summary}
`).join('\n')}

Old Notepad Entries:
${notepad.map(note => `
Note ID: ${note.id}
Note Content:
${note.note}
`).join('\n')}

Notify the developer if you find a significant pattern that warrants their attention. Do not notify for trivial observations.

Respond in strict JSON format as follows:
note: <A concise note capturing any observations or insights that may help in identifying patterns>
notification: <true/false>
explanation: <Brief explanation if violated, else N/A>
caption: <A concise caption for the notification if violated, else N/A>
`;

    const aiResponse = await ai.generate(prompt);
    console.log(`Pattern Agent Response:\n${aiResponse.trim()}`);
    const res = JSON.parse(aiResponse.trim());
    db.addNotepad(res.note);
    if(res.notification === true){
        notifier.notify({
            title: 'Code Change Pattern Noted',
            message: res.explanation || 'A new pattern has been noted from recent code changes.',
            subtitle: res.caption || 'Pattern Noted',
            sound: true,
        });
    }
}