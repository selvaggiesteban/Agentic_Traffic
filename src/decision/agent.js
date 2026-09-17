const OpenAI = require('openai');

class DecisionEngine {
    constructor() {
        const provider = process.env.LLM_PROVIDER || 'nvidia';

        if (provider === 'nvidia') {
            this.client = new OpenAI({
                apiKey: process.env.NVIDIA_API_KEY,
                baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1'
            });
            this.model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-405b-instruct';
        } else {
            // Fallback to standard OpenAI
            this.client = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            this.model = 'gpt-4o';
        }
    }

    async decideNextAction(pageState, persona, userProfile) {
        const prompt = `You are a website user with the persona: ${persona}.
        Your unique profile for this session is: ${JSON.stringify(userProfile)}.

        Current page state: ${pageState}

        Mandatory Goal: You MUST register a new account using your profile before completing a purchase.

        Decide the next action from this list: [register_account, search_product, add_to_cart, proceed_to_checkout, exit].
        Return ONLY the action name.`;

        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                max_tokens: 10,
                messages: [{ role: "user", content: prompt }],
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Decision Engine Error:', error);
            return 'exit'; // Safe fallback
        }
    }
}

module.exports = DecisionEngine;
