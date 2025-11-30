import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the secret key from environment variables
const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
  }
  return new Stripe(key);
};

/**
 * Price configuration for services.
 * In a production app, these would come from Firestore or Stripe Products.
 */
const SERVICE_PRICES: Record<string, number> = {
  'gm-1': 2500,    // Annual Physical Exam
  'gm-2': 1500,    // Vaccinations
  'gm-3': 2000,    // Chronic Disease Management
  'gm-4': 1000,    // Minor Injury Care
  'at-1': 5000,    // Botox Injections
  'at-2': 15000,   // Dermal Fillers
  'at-3': 3500,    // Chemical Peels
  'at-4': 8000,    // Microneedling with PRP
};

const DEFAULT_PRICE = 2500; // Default consultation fee in PHP

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, serviceName, paymentMethod, customerEmail, customerName } = body;

    // Get the price for the service
    const amount = SERVICE_PRICES[serviceId] ?? DEFAULT_PRICE;

    const stripe = getStripe();

    // Define payment method types based on the selected method
    // GCash is supported in the Philippines through Stripe
    let paymentMethodTypes: string[] = ['card'];
    
    if (paymentMethod === 'gcash') {
      paymentMethodTypes = ['gcash'];
    } else if (paymentMethod === 'card') {
      paymentMethodTypes = ['card'];
    } else {
      // Support both for flexibility
      paymentMethodTypes = ['card', 'gcash'];
    }

    // Create a PaymentIntent with the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents/centavos
      currency: 'php', // Philippine Peso
      payment_method_types: paymentMethodTypes,
      metadata: {
        serviceId,
        serviceName: serviceName || 'Medical Consultation',
        customerEmail: customerEmail || '',
        customerName: customerName || '',
      },
      description: `Payment for ${serviceName || 'Medical Consultation'}`,
      receipt_email: customerEmail || undefined,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
