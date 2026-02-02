export class AIClient {
    private modelName: string;
    private endpoint: string;

    constructor(
        modelName = 'qwen3:4b-instruct-2507-q4_K_M',
        endpoint = 'http://localhost:11434/api/generate'
    ) {
        this.modelName = modelName;
        this.endpoint = endpoint;
    }

    async generate(prompt: string): Promise<string> {
        const res = await fetch(this.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.modelName,
                prompt,
                stream: false
            })
        });

        if (!res.ok) {
            throw new Error(`Ollama request failed: ${res.status}`);
        }

        const json = await res.json();
        return json.response;
    }

    generatePrompt(event: string, fileData: string): string {
        return `${this.getSystemPrompt()}\n\nEvent: ${event}\n\n${fileData}`;
    }

    getSystemPrompt(): string {
        return `You are an AI assistant that helps summarize code changes in a concise manner. 
        Given the file data and its change history, provide a summary of the last change made to the file.`;
    }
}

const aiClient = new AIClient();
export default aiClient;