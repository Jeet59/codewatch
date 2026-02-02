import { AIClient } from '../ai';
import { DBClient } from '../db';
import notifier from 'node-notifier';

export default async function ruleAgent(ai: AIClient, db: DBClient, filePath: string) {
    const fileData = db.getRuleAgentData(filePath);
    if (!fileData || !fileData.diff) {
        console.log(`No Rule data found for file: ${filePath}`);
        return;
    }
    const rules = db.getRules();
    const prompt = `
You are an assistant that reviews code changes (diffs + AI summaries) against a set of predefined coding rules. For the given file change, determine if any of the rules have been violated.

File Path: ${filePath}

Diff:
${fileData.diff}

Current Content:
${fileData.current}

AI Summary of Changes:
${fileData.ai_summary}

Rules:
${rules.map(rule => `- ${rule.natural_language}`).join('\n')}

Respond in strict JSON format as follows:
violation: <true/false>
explanation: <Brief explanation if violated, else N/A>
caption: <A concise caption for the notification if violated, else N/A>
`;

    const aiResponse = await ai.generate(prompt);
    console.log(`Rule Agent Response for ${filePath}:\n${aiResponse.trim()}`);
    const res = JSON.parse(aiResponse.trim());
    if (res.violation === true) {
        notifier.notify({
            title: 'Code Change Rule Violation',
            message: res.explanation || 'A code change has violated a predefined rule.',
            subtitle: res.caption || 'Rule Violation Detected',
            sound: true,
        });
    }
}