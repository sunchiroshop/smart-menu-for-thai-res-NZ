# Stripe Payment Setup Guide

This guide will help you set up Stripe for accepting subscription payments in Smart Menu.

## Step 1: Get Your Stripe API Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers > API Keys**
3. Copy these keys:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

> **Note**: Use test keys for development, live keys for production.

---

## Step 2: Create Products and Prices in Stripe

Go to **Products** in Stripe Dashboard and create 3 products:

### Product 1: Starter Plan

1. Click **Add Product**
2. Name: `Starter Plan`
3. Description: `Perfect for small takeaway shops`
4. Add 2 prices:
   - **Monthly**: $39 NZD, Recurring, Monthly
   - **Yearly**: $374.40 NZD, Recurring, Yearly (20% discount)

### Product 2: Professional Plan

1. Click **Add Product**
2. Name: `Professional Plan`
3. Description: `Most Popular - Casual dining restaurants`
4. Add 2 prices:
   - **Monthly**: $89 NZD, Recurring, Monthly
   - **Yearly**: $854.40 NZD, Recurring, Yearly (20% discount)

### Product 3: Enterprise Plan

1. Click **Add Product**
2. Name: `Enterprise Plan`
3. Description: `Fine dining & Restaurant chains`
4. Add 2 prices:
   - **Monthly**: $199 NZD, Recurring, Monthly
   - **Yearly**: $1,910.40 NZD, Recurring, Yearly (20% discount)

### Getting Price IDs

After creating each price, click on it to see its ID:
- Format: `price_1ABC123...`
- Copy each Price ID for your environment variables

---

## Step 3: Set Up Webhook (Optional but Recommended)

Webhooks allow Stripe to notify your server about events like successful payments.

1. Go to **Developers > Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - Development: `https://your-ngrok-url.ngrok.io/api/stripe/webhook`
   - Production: `https://api.yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (`whsec_...`)

---

## Step 4: Configure Environment Variables

### Backend (.env)

```bash
# Copy from .env.example
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```bash
# Copy from .env.local.example
cp webapp/.env.local.example webapp/.env.local
```

Edit `webapp/.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Replace with your actual Price IDs from Stripe Dashboard
NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID=price_1ABC...
NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID=price_1DEF...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_1GHI...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_1JKL...
NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_1MNO...
NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_1PQR...
```

---

## Step 5: Test the Payment Flow

### Test Card Numbers

Use these test cards in Stripe's test mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 3220` | 3D Secure authentication required |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Declined (generic) |

For all test cards:
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Testing Steps

1. Start your backend: `cd backend && python main_ai.py`
2. Start your frontend: `cd webapp && npm run dev`
3. Go to `/pricing` and select a plan
4. On checkout page, select "Credit/Debit Card"
5. Complete Stripe checkout with test card
6. Verify subscription is created in Stripe Dashboard > Customers

---

## Step 6: Production Checklist

Before going live:

- [ ] Switch to live API keys (remove `_test`)
- [ ] Update webhook endpoint to production URL
- [ ] Enable live mode in Stripe Dashboard
- [ ] Test with a real card (small amount)
- [ ] Set up email notifications in Stripe

---

## Troubleshooting

### "Price ID not configured"

- Make sure all NEXT_PUBLIC_STRIPE_*_PRICE_ID variables are set
- Restart the frontend after changing .env.local

### "Stripe API key not configured"

- Check STRIPE_SECRET_KEY is set in backend/.env
- Restart the backend after changes

### Webhook signature verification failed

- Check STRIPE_WEBHOOK_SECRET is correct
- For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
  ```bash
  stripe listen --forward-to localhost:8000/api/stripe/webhook
  ```

### Payment succeeds but subscription not activated

- Check webhook is receiving events
- Verify webhook endpoint is publicly accessible
- Check server logs for errors

---

## Summary

| Environment | Key Variable | Where to Get |
|-------------|--------------|--------------|
| Backend | `STRIPE_SECRET_KEY` | Dashboard > API Keys |
| Backend | `STRIPE_WEBHOOK_SECRET` | Dashboard > Webhooks |
| Frontend | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Dashboard > API Keys |
| Frontend | `NEXT_PUBLIC_STRIPE_*_PRICE_ID` | Dashboard > Products > Price |

---

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
