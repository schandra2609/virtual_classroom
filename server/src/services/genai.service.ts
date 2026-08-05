/**
 * @file genai.service.ts
 * @description Integrates local Ollama LLMs for completely free, unlimited AI generation.
 */
import { ENV_CONFIG } from "../configs/env.config.ts";

export const genaiService = {
    /**
     * @description Calls the local Ollama instance to generate questions in strict JSON.
     * @param prompt - The engineered prompt containing the rules and extracted context.
     * @param pdfBuffers - (Ignored for text-only Llama 3; text must be extracted in the controller).
     */
    generateQuestions: async (
        prompt: string,
        pdfBuffers: Buffer[] = [],
        mimeType: string = "application/pdf"
    ): Promise<any[]> => {
        const modelName = "openai/gpt-oss-120b";
        try {
            const response = await fetch(ENV_CONFIG.GENAI.API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${ENV_CONFIG.GENAI.API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        {
                            role: "system",
                            content: "You are an API that only responds with raw, valid JSON arrays. Never include markdown blocks, explanations, or conversational text."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.2
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API responded with status: ${response.status} - ${errorText}`);
            }

            const data: any = await response.json();

            if (!data.choices || data.choices.length === 0) {
                throw new Error("Groq returned an empty response.");
            }

            let generatedText = data.choices[0].message.content.trim();

            if (generatedText.startsWith("```json")) {
                generatedText = generatedText.replace(/^```json\n/, "").replace(/\n```$/, "");
            } else if (generatedText.startsWith("```")) {
                generatedText = generatedText.replace(/^```\n/, "").replace(/\n```$/, "");
            }

            return JSON.parse(generatedText);
        } catch (error) {
            console.error("Groq GenAI Generation Failed:", error);
            throw new Error("Failed to generate questions via Groq API.");
        }
    }
};