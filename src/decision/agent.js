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

    async decideNextAction(pageState, persona, userProfile, currentStep = 0) {
        const prompt = `You are a website user with the persona: ${persona}.
        Your unique profile for this session is: ${JSON.stringify(userProfile)}.

        Current page state: ${pageState}

        Mandatory Goal: You MUST register a new account using your profile before completing a purchase.

        Decide the next action from this list: [register_account, search_product, add_to_cart, proceed_to_checkout, exit].
        Return ONLY the action name.`;

        // Try primary model, then fallback to a secondary model before the linear flow
        const modelsToTry = [this.model];

        for (const model of modelsToTry) {
            try {
                const response = await this.client.chat.completions.create({
                    model: model,
                    max_tokens: 10,
                    messages: [{ role: "user", content: prompt }],
                });
                console.log(`[DEBUG] Model ${model} response: ${JSON.stringify(response)}`);

                const content = response.choices[0]?.message?.content;
                if (!content) {
                    throw new Error('LLM returned an empty response');
                }
                return content.trim();
            } catch (error) {
                console.error(`Model ${model} failed: ${error.message}`);
                if (model === modelsToTry[modelsToTry.length - 1]) {
                    // All AI models failed, use linear fallback
                    console.error('All AI models failed. Falling back to linear flow.');
                    const fallbackFlow = ['register_account', 'search_product', 'add_to_cart', 'proceed_to_checkout', 'exit'];
                    return currentStep < fallbackFlow.length ? fallbackFlow[currentStep] : 'exit';
                }
            }
        }
    }
}

module.exports = DecisionEngine;
