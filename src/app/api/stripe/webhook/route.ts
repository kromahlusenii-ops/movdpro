import { NextRequest, NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/db'
import { sendWelcomeProEmail } from '@/lib/email'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.customer && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const locator = await prisma.locatorProfile.update({
            where: { stripeCustomerId: session.customer as string },
            data: {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: 'active',
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
            include: { user: { select: { email: true } } },
          })

          // Send welcome email (fire-and-forget)
          sendWelcomeProEmail({ to: locator.user.email }).catch((err) =>
            console.error('Failed to send welcome email:', err)
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        await prisma.locatorProfile.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        await prisma.locatorProfile.update({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer && invoice.billing_reason === 'subscription_cycle') {
          const resetAt = new Date()
          resetAt.setMonth(resetAt.getMonth() + 1)
          await prisma.locatorProfile.update({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              creditsRemaining: 50,
              creditsResetAt: resetAt,
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.customer) {
          await prisma.locatorProfile.update({
            where: { stripeCustomerId: invoice.customer as string },
            data: { subscriptionStatus: 'past_due' },
          })
        }
        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
