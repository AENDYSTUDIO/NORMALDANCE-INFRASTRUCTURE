import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripeWebhookPostSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

export const dynamic = 'force-dynamic'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY not set')
  return new Stripe(key, { apiVersion: '2023-10-16' })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  const rawBody = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    stripeWebhookPostSchema.parse(event); // Validate the event object

    switch (event.type) {
      case 'checkout.session.completed':
        // TODO: fulfill purchase
        break
      case 'payment_intent.succeeded':
        break
      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    return handleApiError(err)
  }
}
