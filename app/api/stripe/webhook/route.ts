import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? 'placeholder', {
    apiVersion: '2026-03-25.dahlia',
  })
}

// Plan → request limit mapping
const PLAN_LIMITS: Record<string, { plan: string; limit: number }> = {
  [process.env.STRIPE_PRICE_STARTER ?? 'price_starter']: { plan: 'Starter', limit: 5  },
  [process.env.STRIPE_PRICE_GROWTH  ?? 'price_growth']:  { plan: 'Growth',  limit: 15 },
  [process.env.STRIPE_PRICE_STUDIO  ?? 'price_studio']:  { plan: 'Studio',  limit: 999 },
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? '')
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id ?? ''
      const planInfo = PLAN_LIMITS[priceId]

      await prisma.client.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          stripeSubscriptionId: sub.id,
          stripePriceId:        priceId,
          subscriptionStatus:   sub.status,
          ...(planInfo ? { plan: planInfo.plan, requestLimit: planInfo.limit } : {}),
        },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.client.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: {
          subscriptionStatus: 'canceled',
          requestLimit: 0,
        },
      })
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      await prisma.client.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { subscriptionStatus: 'active' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await prisma.client.updateMany({
        where: { stripeCustomerId: invoice.customer as string },
        data: { subscriptionStatus: 'past_due' },
      })
      break
    }

    default:
      // Unhandled event — ignore
      break
  }

  return NextResponse.json({ received: true })
}
