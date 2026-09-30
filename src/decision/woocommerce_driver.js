class WooCommerceDriver {
    async decideNextAction(pageState, persona, userProfile, currentStep = 0) {
        const sequence = [
            'register_account',
            'search_product',
            'add_to_cart',
            'proceed_to_checkout',
            'exit'
        ];

        if (currentStep >= sequence.length) {
            return 'exit';
        }

        return sequence[currentStep];
    }
}

module.exports = WooCommerceDriver;
