#!/bin/bash
# Create or update Stripe webhook endpoint for Convex
# Run: ./scripts/setup-stripe-webhook.sh [--prod]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROD_FLAG=""
if [ "$1" = "--prod" ]; then
  PROD_FLAG="--prod"
  echo -e "${YELLOW}Setting up PRODUCTION webhook${NC}"
else
  echo -e "${YELLOW}Setting up DEVELOPMENT webhook${NC}"
fi

# Get Stripe secret key from Convex
STRIPE_SECRET=$(npx convex env list $PROD_FLAG 2>&1 | grep STRIPE_SECRET_KEY | cut -d= -f2)

if [ -z "$STRIPE_SECRET" ]; then
  echo -e "${RED}Error: STRIPE_SECRET_KEY not found in Convex environment${NC}"
  exit 1
fi

# Get Convex site URL
if [ "$PROD_FLAG" = "--prod" ]; then
  # For prod, we need to get the prod Convex URL
  # This assumes CONVEX_URL format, adjust as needed
  CONVEX_URL=$(npx convex env list --prod 2>&1 | grep NEXT_PUBLIC_CONVEX_URL | cut -d= -f2 || echo "")
  if [ -z "$CONVEX_URL" ]; then
    echo -e "${RED}Error: Could not determine production Convex URL${NC}"
    echo "Please set CONVEX_SITE_URL environment variable or check your Convex deployment"
    exit 1
  fi
else
  CONVEX_URL=$(grep NEXT_PUBLIC_CONVEX_URL .env.local 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
fi

WEBHOOK_URL=$(echo "$CONVEX_URL" | sed 's/\.cloud/.site/')/stripe/webhook

echo "Webhook URL: $WEBHOOK_URL"

# Check if webhook already exists
EXISTING=$(curl -s -u "$STRIPE_SECRET:" "https://api.stripe.com/v1/webhook_endpoints" | \
  jq -r --arg url "$WEBHOOK_URL" '.data[] | select(.url == $url) | .id' | head -1)

if [ -n "$EXISTING" ]; then
  echo -e "${YELLOW}Webhook endpoint already exists: $EXISTING${NC}"
  echo "Updating enabled events..."

  # Update the webhook
  RESULT=$(curl -s -u "$STRIPE_SECRET:" -X POST "https://api.stripe.com/v1/webhook_endpoints/$EXISTING" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=customer.subscription.created" \
    -d "enabled_events[]=customer.subscription.updated" \
    -d "enabled_events[]=customer.subscription.deleted" \
    -d "enabled_events[]=invoice.payment_succeeded" \
    -d "enabled_events[]=invoice.payment_failed")

  echo "$RESULT" | jq '{id, url, status, enabled_events}'
else
  echo "Creating new webhook endpoint..."

  RESULT=$(curl -s -u "$STRIPE_SECRET:" "https://api.stripe.com/v1/webhook_endpoints" \
    -d "url=$WEBHOOK_URL" \
    -d "enabled_events[]=checkout.session.completed" \
    -d "enabled_events[]=customer.subscription.created" \
    -d "enabled_events[]=customer.subscription.updated" \
    -d "enabled_events[]=customer.subscription.deleted" \
    -d "enabled_events[]=invoice.payment_succeeded" \
    -d "enabled_events[]=invoice.payment_failed")

  WEBHOOK_ID=$(echo "$RESULT" | jq -r '.id')
  WEBHOOK_SECRET=$(echo "$RESULT" | jq -r '.secret')

  if [ -n "$WEBHOOK_SECRET" ] && [ "$WEBHOOK_SECRET" != "null" ]; then
    echo -e "${GREEN}Webhook created successfully!${NC}"
    echo "  ID: $WEBHOOK_ID"
    echo "  URL: $WEBHOOK_URL"
    echo ""
    echo -e "${YELLOW}Updating Convex with new webhook secret...${NC}"

    npx convex env set $PROD_FLAG STRIPE_WEBHOOK_SECRET "$WEBHOOK_SECRET"
    echo -e "${GREEN}Done!${NC}"
  else
    echo -e "${RED}Failed to create webhook:${NC}"
    echo "$RESULT" | jq .
    exit 1
  fi
fi
