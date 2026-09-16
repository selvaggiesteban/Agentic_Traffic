const Anthropic = require('@anthropic-ai/sdk');

class DecisionEngine {
    constructor(apiKey) {
        this.client = new Anthropic({ apiKey });
    }

    async decideNextAction(pageState, persona) {
        const prompt = `You are a website user with the persona: ${persona}.
        Current page state: ${pageState}
        Decide the next action from this list: [search_product, add_to_cart, proceed_to_checkout, exit].
        Return ONLY the action name.`;

        const response = await this.client.messages.create({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 10,
            messages: [{ role: "user", content: prompt }],
        });

        return response.content[0].text.trim();
    }
}

module.exports = DecisionEngine;
