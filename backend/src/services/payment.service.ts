import Stripe from "stripe";
import { AppError } from "../utils/AppError";

/* Payment, via Stripe Checkout: Stripe's own hosted payment page. We
 * create a session server-side and redirect the browser to Stripe's
 * domain -- our frontend never collects or even sees card details, and
 * no secret key is ever sent to the browser. This is the correct
 * architecture regardless of whether a real key is configured.
 *
 * No STRIPE_SECRET_KEY is configured in this project (no payment
 * provider account exists). Per the platform rule against simulating
 * payment success, there is no "demo" fallback here the way hotel
 * search has one: a payment either really goes through a real
 * provider, or it honestly fails with a clear reason. When the key is
 * missing, createCheckoutSession() throws a 503 naming exactly what's
 * missing, rather than pretending to charge anything. */

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new AppError(
      503,
      "Payment is not available: no payment provider is connected (STRIPE_SECRET_KEY is not configured). " +
        "This booking has not been charged.",
    );
  }
  return new Stripe(secretKey);
}

export interface CheckoutInput {
  bookingId: string;
  hotelName: string;
  totalPriceUsd: number;
  nights: number;
  successUrl: string;
  cancelUrl: string;
}

export function isPaymentConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createCheckoutSession(input: CheckoutInput): Promise<{ checkoutUrl: string }> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(input.totalPriceUsd * 100),
          product_data: {
            name: input.hotelName,
            description: `${input.nights} night${input.nights === 1 ? "" : "s"}`,
          },
        },
        quantity: 1,
      },
    ],
    client_reference_id: input.bookingId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });

  if (!session.url) {
    throw new AppError(502, "Payment provider did not return a checkout URL.");
  }
  return { checkoutUrl: session.url };
}
