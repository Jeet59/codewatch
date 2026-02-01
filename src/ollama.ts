export class OllamaClient {
  private modelName: string;
  private endpoint: string;
  private timeoutMs: number;

  constructor(
    modelName = 'qwen3:4b-instruct-2507-q4_K_M',
    endpoint = 'http://localhost:11434/api/generate',
    timeoutMs = 20000
  ) {
    this.modelName = modelName;
    this.endpoint = endpoint;
    this.timeoutMs = timeoutMs;
  }

  async generate(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({ model: this.modelName, prompt })
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text().catch(() => '<unreadable body>');
        throw new Error(`Ollama request failed: ${res.status} ${res.statusText} - ${body}`);
      }

      const text = await res.text();

      // Try to parse JSON response; fall back to raw text.
      try {
        const json = JSON.parse(text);

        // Common response shapes: { output: '...' } or { text: '...' } or { results: [...] }
        if (typeof json === 'string') return json;
        if (json.output && typeof json.output === 'string') return json.output;
        if (json.text && typeof json.text === 'string') return json.text;
        if (Array.isArray(json.results)) {
          return json.results
            .map((r: any) => (typeof r === 'string' ? r : JSON.stringify(r)))
            .join('');
        }

        // If no known field, return the stringified JSON
        return JSON.stringify(json);
      } catch (e) {
        return text;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Ollama request timed out');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default OllamaClient;
