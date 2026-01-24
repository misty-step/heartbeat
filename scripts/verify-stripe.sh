#!/bin/bash
# Verify Stripe configuration before deployment
# Run: ./scripts/verify-stripe.sh [--prod]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROD_FLAG=""
if [ "$1" = "--prod" ]; then
  PROD_FLAG="--prod"
  echo -e "${YELLOW}Checking PRODUCTION environment${NC}"
else
  echo -e "${YELLOW}Checking DEVELOPMENT environment${NC}"
fi

ERRORS=0

check() {
  local name="$1"
  local status="$2"
  local message="$3"

  if [ "$status" = "ok" ]; then
    echo -e "  ${GREEN}✓${NC} $name"
  else
    echo -e "  ${RED}✗${NC} $name: $message"
    ERRORS=$((ERRORS + 1))
  fi
}

echo ""
echo "=== Stripe Environment Variables ==="

# Get env vars from Convex
ENV_OUTPUT=$(npx convex env list $PROD_FLAG 2>&1)

STRIPE_SECRET=$(echo "$ENV_OUTPUT" | grep STRIPE_SECRET_KEY | cut -d= -f2)
STRIPE_WEBHOOK=$(echo "$ENV_OUTPUT" | grep STRIPE_WEBHOOK_SECRET | cut -d= -f2)
PRICE_PULSE_M=$(echo "$ENV_OUTPUT" | grep STRIPE_PRICE_PULSE_MONTHLY | cut -d= -f2)
PRICE_PULSE_Y=$(echo "$ENV_OUTPUT" | grep STRIPE_PRICE_PULSE_YEARLY | cut -d= -f2)
PRICE_VITAL_M=$(echo "$ENV_OUTPUT" | grep STRIPE_PRICE_VITAL_MONTHLY | cut -d= -f2)
PRICE_VITAL_Y=$(echo "$ENV_OUTPUT" | grep STRIPE_PRICE_VITAL_YEARLY | cut -d= -f2)

[ -n "$STRIPE_SECRET" ] && check "STRIPE_SECRET_KEY" "ok" || check "STRIPE_SECRET_KEY" "error" "Not set"
[ -n "$STRIPE_WEBHOOK" ] && check "STRIPE_WEBHOOK_SECRET" "ok" || check "STRIPE_WEBHOOK_SECRET" "error" "Not set"
[ -n "$PRICE_PULSE_M" ] && check "STRIPE_PRICE_PULSE_MONTHLY" "ok" || check "STRIPE_PRICE_PULSE_MONTHLY" "error" "Not set"
[ -n "$PRICE_PULSE_Y" ] && check "STRIPE_PRICE_PULSE_YEARLY" "ok" || check "STRIPE_PRICE_PULSE_YEARLY" "error" "Not set"
[ -n "$PRICE_VITAL_M" ] && check "STRIPE_PRICE_VITAL_MONTHLY" "ok" || check "STRIPE_PRICE_VITAL_MONTHLY" "error" "Not set"
[ -n "$PRICE_VITAL_Y" ] && check "STRIPE_PRICE_VITAL_YEARLY" "ok" || check "STRIPE_PRICE_VITAL_YEARLY" "error" "Not set"

if [ -z "$STRIPE_SECRET" ]; then
  echo ""
  echo -e "${RED}Cannot continue without STRIPE_SECRET_KEY${NC}"
  exit 1
fi

echo ""
echo "=== Stripe API Connectivity ==="

# Test API connectivity
ACCOUNT_INFO=$(curl -s -u "$STRIPE_SECRET:" "https://api.stripe.com/v1/account" 2>&1)
ACCOUNT_NAME=$(echo "$ACCOUNT_INFO" | jq -r '.settings.dashboard.display_name // .business_profile.name // "Unknown"' 2>/dev/null)
ACCOUNT_ID=$(echo "$ACCOUNT_INFO" | jq -r '.id // "Unknown"' 2>/dev/null)

if [ "$ACCOUNT_ID" != "Unknown" ] && [ -n "$ACCOUNT_ID" ]; then
  check "API Connection" "ok"
  echo "  Account: $ACCOUNT_NAME ($ACCOUNT_ID)"
else
  check "API Connection" "error" "Failed to connect to Stripe API"
fi

echo ""
echo "=== Webhook Configuration ==="

# Get Convex site URL
CONVEX_URL=$(grep NEXT_PUBLIC_CONVEX_URL .env.local 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
EXPECTED_WEBHOOK_URL=$(echo "$CONVEX_URL" | sed 's/\.cloud/.site/')/stripe/webhook

echo "  Expected URL: $EXPECTED_WEBHOOK_URL"

# Check webhook endpoints
WEBHOOKS=$(curl -s -u "$STRIPE_SECRET:" "https://api.stripe.com/v1/webhook_endpoints" 2>&1)
MATCHING_WEBHOOK=$(echo "$WEBHOOKS" | jq -r --arg url "$EXPECTED_WEBHOOK_URL" '.data[] | select(.url == $url and .status == "enabled") | .id' 2>/dev/null | head -1)

if [ -n "$MATCHING_WEBHOOK" ]; then
  check "Webhook endpoint configured" "ok"

  # Check required events
  WEBHOOK_EVENTS=$(echo "$WEBHOOKS" | jq -r --arg id "$MATCHING_WEBHOOK" '.data[] | select(.id == $id) | .enabled_events[]' 2>/dev/null)

  REQUIRED_EVENTS=(
    "checkout.session.completed"
    "customer.subscription.created"
    "customer.subscription.updated"
    "customer.subscription.deleted"
    "invoice.payment_succeeded"
    "invoice.payment_failed"
  )

  for event in "${REQUIRED_EVENTS[@]}"; do
    # Use grep with word boundaries and handle potential special chars
    if echo "$WEBHOOK_EVENTS" | grep -qF "$event" || echo "$WEBHOOK_EVENTS" | grep -qF "*"; then
      check "Event: $event" "ok"
    else
      check "Event: $event" "error" "Not enabled"
    fi
  done
else
  check "Webhook endpoint configured" "error" "No enabled webhook found for $EXPECTED_WEBHOOK_URL"

  echo ""
  echo -e "${YELLOW}Available webhook endpoints:${NC}"
  echo "$WEBHOOKS" | jq -r '.data[] | "  \(.status): \(.url)"' 2>/dev/null

  echo ""
  echo -e "${YELLOW}To create the webhook endpoint, run:${NC}"
  echo "  ./scripts/setup-stripe-webhook.sh"
fi

echo ""
echo "=== Price Verification ==="

# Verify prices exist in Stripe
for PRICE_VAR in "PRICE_PULSE_M:$PRICE_PULSE_M" "PRICE_PULSE_Y:$PRICE_PULSE_Y" "PRICE_VITAL_M:$PRICE_VITAL_M" "PRICE_VITAL_Y:$PRICE_VITAL_Y"; do
  NAME=$(echo "$PRICE_VAR" | cut -d: -f1)
  ID=$(echo "$PRICE_VAR" | cut -d: -f2)

  if [ -n "$ID" ]; then
    PRICE_INFO=$(curl -s -u "$STRIPE_SECRET:" "https://api.stripe.com/v1/prices/$ID" 2>&1)
    PRICE_ACTIVE=$(echo "$PRICE_INFO" | jq -r '.active' 2>/dev/null)

    if [ "$PRICE_ACTIVE" = "true" ]; then
      check "$NAME ($ID)" "ok"
    else
      check "$NAME ($ID)" "error" "Price not found or not active"
    fi
  fi
done

echo ""
echo "=== Summary ==="

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}$ERRORS check(s) failed${NC}"
  exit 1
fi
