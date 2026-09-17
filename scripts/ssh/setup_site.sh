#!/bin/bash
# setup_site.sh - Fast preparation of the WooCommerce environment

# Configuration
USER_COUNT=100
PRODUCT_COUNT=50

echo "🚀 Starting mass preparation of WooCommerce site..."

# 1. Bulk Create Customers
echo "👥 Creating $USER_COUNT test customers..."
for i in $(seq 1 $USER_COUNT); do
    wp user create "testuser_$i" "testuser_$i@example.com" --role=customer --user_pass="TestPassword123!"
done

# 2. Bulk Create Products
echo "📦 Creating $PRODUCT_COUNT test products..."
for i in $(seq 1 $PRODUCT_COUNT); do
    wp wc product create --name="Test Product $i" --regular_price="19.99" --stock_status="instock" --manage_stock=1 --stock_quantity=1000
done

echo "✅ Site preparation complete. Environment is ready for stress testing."
