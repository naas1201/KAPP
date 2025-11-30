'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CreditCard, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentFormProps {
  serviceId: string;
  serviceName: string;
  paymentMethod: 'card' | 'gcash';
  customerEmail: string;
  customerName: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

function PaymentFormContent({
  onPaymentSuccess,
  onPaymentError,
  paymentMethod,
  customerName,
}: {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  paymentMethod: 'card' | 'gcash';
  customerName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success`,
          payment_method_data: {
            billing_details: {
              name: customerName,
            },
          },
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred during payment.');
        onPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Handle additional actions (3D Secure, etc.)
        setErrorMessage('Additional verification required. Please follow the prompts.');
      } else {
        setErrorMessage('Payment could not be completed. Please try again.');
        onPaymentError('Payment status: ' + (paymentIntent?.status || 'unknown'));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMessage(message);
      onPaymentError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-background">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: paymentMethod === 'gcash' ? ['gcash'] : ['card'],
          }}
        />
      </div>

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            {paymentMethod === 'gcash' ? (
              <Wallet className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Pay & Confirm Booking
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  );
}

export function StripePaymentForm({
  serviceId,
  serviceName,
  paymentMethod,
  customerEmail,
  customerName,
  onPaymentSuccess,
  onPaymentError,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);

  const createPaymentIntent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          serviceName,
          paymentMethod,
          customerEmail,
          customerName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setAmount(data.amount);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize payment';
      setError(message);
      onPaymentError(message);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, serviceName, paymentMethod, customerEmail, customerName, onPaymentError]);

  useEffect(() => {
    createPaymentIntent();
  }, [createPaymentIntent]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Initializing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button
            variant="link"
            className="ml-2 p-0 h-auto"
            onClick={createPaymentIntent}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to initialize payment. Please refresh and try again.
        </AlertDescription>
      </Alert>
    );
  }

  const stripePromise = getStripe();

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/50 flex justify-between items-center">
        <div>
          <p className="font-semibold">{serviceName}</p>
          <p className="text-sm text-muted-foreground">Consultation Fee</p>
        </div>
        <p className="text-lg font-bold">₱{amount.toLocaleString()}</p>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#0f766e', // Teal color matching the app theme
              colorBackground: '#ffffff',
              colorText: '#1f2937',
              colorDanger: '#dc2626',
              fontFamily: 'system-ui, sans-serif',
              spacingUnit: '4px',
              borderRadius: '8px',
            },
          },
        }}
      >
        <PaymentFormContent
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          paymentMethod={paymentMethod}
          customerName={customerName}
        />
      </Elements>
    </div>
  );
}
