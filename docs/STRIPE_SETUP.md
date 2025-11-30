# Stripe Payment Integration Guide

This guide explains how to set up Stripe payments for the KAPP medical booking application.

## Overview

The application uses Stripe for payment processing, supporting:
- **Credit/Debit Cards** - Visa, Mastercard, American Express, etc.
- **GCash** - Philippine e-wallet (available through Stripe's Philippines integration)

## Quick Setup

### 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Navigate to **Developers** → **API Keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Configure Environment Variables

Create a `.env.local` file in the project root (or set these in your hosting platform):

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important Security Notes:**
- Never commit `.env.local` to version control
- The `NEXT_PUBLIC_` prefix makes the publishable key available to the browser (this is safe)
- The `STRIPE_SECRET_KEY` should only be used server-side (in API routes)

### 3. Enable GCash (Philippines)

To accept GCash payments:

1. Go to **Settings** → **Payment methods** in your Stripe Dashboard
2. Find "GCash" under the Philippines section
3. Enable it for your account
4. You may need to verify your business for live payments

## Testing Payments

### Test Card Numbers

Use these card numbers in test mode:

| Card Type | Number | CVC | Expiry |
|-----------|--------|-----|--------|
| Success | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Declined | 4000 0000 0000 0002 | Any 3 digits | Any future date |
| 3D Secure | 4000 0025 0000 3155 | Any 3 digits | Any future date |

### Test GCash

In test mode, GCash will simulate the payment flow without actually charging.

## Going Live

### Checklist Before Going Live

1. **Switch to Live Keys**
   - Replace `pk_test_` with `pk_live_`
   - Replace `sk_test_` with `sk_live_`

2. **Verify Business**
   - Complete business verification in Stripe Dashboard
   - Provide required documentation

3. **Enable Live Payment Methods**
   - Activate cards and GCash for live mode
   - Review transaction fees for the Philippines

4. **Configure Webhooks** (Optional but recommended)
   - Set up webhook endpoints for payment events
   - Handle payment success/failure notifications

5. **Review Security**
   - Ensure HTTPS is enabled
   - Verify environment variables are set correctly
   - Test the complete payment flow

## Service Pricing Configuration

Service prices are configured in `/src/app/api/stripe/create-payment-intent/route.ts`:

```typescript
const SERVICE_PRICES: Record<string, number> = {
  'gm-1': 2500,    // Annual Physical Exam - ₱2,500
  'gm-2': 1500,    // Vaccinations - ₱1,500
  'gm-3': 2000,    // Chronic Disease Management - ₱2,000
  'gm-4': 1000,    // Minor Injury Care - ₱1,000
  'at-1': 5000,    // Botox Injections - ₱5,000
  'at-2': 15000,   // Dermal Fillers - ₱15,000
  'at-3': 3500,    // Chemical Peels - ₱3,500
  'at-4': 8000,    // Microneedling with PRP - ₱8,000
};
```

To update prices, modify this object. In a production environment, consider storing prices in Firestore for easy updates without code changes.

## Payment Flow

1. **User selects a service** and proceeds through booking steps
2. **Payment method selection** - User chooses between Card or GCash
3. **Payment form displayed** - Stripe Elements renders secure payment form
4. **Payment processing** - 
   - Card: Processes immediately
   - GCash: Redirects to GCash app/website
5. **Confirmation** - On success, appointment is created with payment record

## Firestore Data Structure

When a payment is successful, the following data is stored:

```javascript
// For authenticated users - in /patients/{userId}/appointments/{appointmentId}
{
  patientId: "user_uid",
  doctorId: "doctor_id",
  serviceType: "Service Name",
  dateTime: "2025-01-15T10:00:00.000Z",
  status: "confirmed",  // Payment confirmed automatically
  paymentIntentId: "pi_xxxxx",  // Stripe Payment Intent ID
  paymentStatus: "paid",
  notes: "Booked and paid via website."
}

// For guest users - in /leads/{leadId}
{
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "09171234567",
  source: "Booking Form",
  serviceInterest: "Service Name",
  paymentIntentId: "pi_xxxxx",
  paymentStatus: "paid",
  createdAt: serverTimestamp()
}
```

## Troubleshooting

### "Missing STRIPE_SECRET_KEY environment variable"

The server-side secret key is not configured. Ensure `STRIPE_SECRET_KEY` is set in your environment.

### "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"

The client-side publishable key is not configured. Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set.

### GCash Not Showing

- Verify GCash is enabled in your Stripe Dashboard
- Ensure you're using Philippine Peso (PHP) currency
- GCash may require business verification for live mode

### Payment Fails Immediately

- Check Stripe Dashboard for detailed error logs
- Verify test mode is enabled for testing
- Ensure the card number is correct for test mode

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe PHP Support**: https://stripe.com/ph
- **Stripe Support**: https://support.stripe.com

## Environment Variables Summary

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public key for Stripe.js | Yes |
| `STRIPE_SECRET_KEY` | Secret key for API calls | Yes |

---

**Note**: For production deployment to Firebase App Hosting, set these environment variables in the Firebase Console under your project's App Hosting configuration.
