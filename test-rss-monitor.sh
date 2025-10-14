#!/bin/bash

# Test RSS Monitor Endpoint
# This script helps you test if your CRON_SECRET is working

echo "🧪 Testing RSS Monitor Endpoint..."
echo ""

# Check if CRON_SECRET is provided
if [ -z "$1" ]; then
  echo "❌ Error: CRON_SECRET not provided"
  echo ""
  echo "Usage: ./test-rss-monitor.sh YOUR_CRON_SECRET"
  echo ""
  echo "Example:"
  echo "  ./test-rss-monitor.sh dev-cron-secret-change-in-production"
  echo ""
  echo "To find your production CRON_SECRET:"
  echo "  1. Go to Vercel dashboard"
  echo "  2. Settings → Environment Variables"
  echo "  3. Look for CRON_SECRET"
  echo "  4. Use that value here"
  exit 1
fi

CRON_SECRET=$1
VERCEL_URL="https://scottish-compliance-4gnrlld19-cyberdexas-projects.vercel.app"

echo "🌐 Testing endpoint: $VERCEL_URL/api/cron/rss-monitor"
echo "🔑 Using CRON_SECRET: ${CRON_SECRET:0:10}..." 
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$VERCEL_URL/api/cron/rss-monitor")

# Extract HTTP code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "📡 HTTP Status Code: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS! The CRON_SECRET works!"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo "✨ You can now use this CRON_SECRET in GitHub Actions:"
  echo "   1. Go to: https://github.com/CyberDexa/scotcomply/settings/secrets/actions"
  echo "   2. Create new secret: CRON_SECRET"
  echo "   3. Value: $CRON_SECRET"
elif [ "$HTTP_CODE" = "401" ]; then
  echo "❌ UNAUTHORIZED! The CRON_SECRET is incorrect."
  echo ""
  echo "This means the secret you're using doesn't match what's on Vercel."
  echo ""
  echo "To fix:"
  echo "  1. Go to Vercel dashboard"
  echo "  2. Check the actual CRON_SECRET value"
  echo "  3. Run this script again with the correct value"
else
  echo "⚠️  Unexpected status code: $HTTP_CODE"
  echo ""
  echo "Response:"
  echo "$BODY"
fi

echo ""
