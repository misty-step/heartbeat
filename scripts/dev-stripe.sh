#!/bin/bash
# Forward Stripe webhooks to local Convex HTTP endpoint

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
  echo "[Stripe] CLI not installed. Install with: brew install stripe/stripe-cli/stripe"
  echo "[Stripe] Webhook forwarding disabled - continuing without it"
  # Keep process alive so concurrently doesn't restart
  while true; do sleep 86400; done
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
  echo "[Stripe] Not logged in. Run: stripe login"
  echo "[Stripe] Webhook forwarding disabled - continuing without it"
  while true; do sleep 86400; done
fi

# Get Convex site URL
if [ -n "$CONVEX_SITE_URL" ]; then
  WEBHOOK_URL="$CONVEX_SITE_URL/stripe/webhook"
elif [ -f .env.local ]; then
  # Derive from NEXT_PUBLIC_CONVEX_URL (replace .cloud with .site)
  CONVEX_URL=$(grep NEXT_PUBLIC_CONVEX_URL .env.local | cut -d= -f2 | tr -d '"' | tr -d "'")
  WEBHOOK_URL=$(echo "$CONVEX_URL" | sed 's/\.cloud/.site/')/stripe/webhook
else
  echo "Error: Set CONVEX_SITE_URL or ensure .env.local has NEXT_PUBLIC_CONVEX_URL"
  exit 1
fi

echo "Forwarding Stripe webhooks to: $WEBHOOK_URL"
stripe listen --forward-to "$WEBHOOK_URL"
