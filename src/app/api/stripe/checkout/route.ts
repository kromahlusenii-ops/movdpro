import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import prisma from '@/lib/db'
import { getSessionUserCached } from '@/lib/pro-auth'

export async function POST() {
  try {
    const user = await getSessionUserCached()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const locator = await prisma.locatorProfile.findUnique({
      where: { userId: user.id },
    })

    if (!locator) {
      return NextResponse.json({ error: 'No locator profile' }, { status: 400 })
    }

    // Create Stripe customer if needed
    let customerId = locator.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { locatorProfileId: locator.id, userId: user.id },
      })
      customerId = customer.id

      await prisma.locatorProfile.update({
        where: { id: locator.id },
        data: { stripeCustomerId: customerId },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/welcome`,
      cancel_url: `${baseUrl}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
