import { DBClient } from "../db";
import { AIClient } from "../ai";

export default async function summaryAgent(ai: AIClient, db: DBClient, filePath: string) {
    const fileData = db.getSummaryAgentData(filePath);
    if (!fileData.diff || !fileData.changeHistoryId) {
        console.log(`No diff found for file: ${filePath}`);
        return;
    }

    const prompt = `
    Given the following diff of a file and its current content, provide a concise summary of the changes made.

    Diff:
    ${fileData.diff}

    Current Content:
    ${fileData.current}

    Summary:
    `;

    const aiSummary = await ai.generate(prompt);
    console.log(`AI Summary: ${aiSummary.trim()}`);
    db.setAISummary(fileData.changeHistoryId, aiSummary.trim());
}