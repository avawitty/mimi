import { STRIPE_PRICES, PlanTier } from '../constants';

export const createCheckoutSession = async (plan: Exclude<PlanTier, 'free'>, userId: string, email?: string | null) => {
  try {
    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        email,
        plan,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    if (data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};
