#!/bin/bash
# cleanup_site.sh - Fast cleanup of the WooCommerce environment

echo "🧹 Starting instant cleanup of test data..."

# 1. Delete test orders (via SQL for speed)
echo "🗑️ Deleting test orders..."
wp db query "DELETE FROM wp_posts WHERE post_type = 'shop_order';"
wp db query "DELETE FROM wp_woocommerce_order_items;"
wp db query "DELETE FROM wp_woocommerce_order_itemmeta;"

# 2. Delete test users
echo "👥 Deleting test users..."
# This identifies users with 'testuser_' prefix
TEST_USERS=$(wp user list --field=ID --search="testuser_")
for ID in $TEST_USERS; do
    wp user delete $ID
done

echo "✅ Cleanup complete. Site restored to baseline."
