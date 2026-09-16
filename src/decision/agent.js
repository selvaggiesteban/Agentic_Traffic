const Anthropic = require('@anthropic-ai/sdk');

class DecisionEngine {
    constructor(apiKey) {
        this.client = new Anthropic({ apiKey });
    }

    async decideNextAction(pageState, persona, userProfile) {
        const prompt = `You are a website user with the persona: ${persona}.
        Your unique profile for this session is: ${JSON.stringify(userProfile)}.

        Current page state: ${pageState}

        Mandatory Goal: You MUST register a new account using your profile before completing a purchase.

        Decide the next action from this list: [register_account, search_product, add_to_cart, proceed_to_checkout, exit].
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
