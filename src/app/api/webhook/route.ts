import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return new Response('Missing Stripe signature', { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const email = session.customer_details?.email
      const { userId, orderId } = session.metadata ?? {}

      if (!email || !userId || !orderId) {
        throw new Error('Missing essential metadata or email')
      }

      const billing = session.customer_details?.address
      const shipping = session.shipping_details?.address
      const customerName = session.customer_details?.name || 'Unknown'

      if (!billing || !shipping) {
        throw new Error('Missing address info from session')
      }

      // Create shipping address
      const createdShipping = await db.shippingAddress.create({
        data: {
          name: customerName,
          city: shipping.city!,
          country: shipping.country!,
          postalCode: shipping.postal_code!,
          street: shipping.line1!,
          state: shipping.state ?? '',
        },
      })

      // Create billing address
      const createdBilling = await db.billingAddress.create({
        data: {
          name: customerName,
          city: billing.city!,
          country: billing.country!,
          postalCode: billing.postal_code!,
          street: billing.line1!,
          state: billing.state ?? '',
        },
      })

      // Update the order
      await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          billingAddressId: createdBilling.id,
          shippingAddressId: createdShipping.id,
        },
      })

      console.log(`✅ Order ${orderId} marked as paid`)
    }

    return NextResponse.json({ result: event, ok: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('❌ Webhook error:', errorMessage)
  
    return NextResponse.json(
      { message: 'Webhook failed', ok: false, error: errorMessage },
      { status: 500 }
    )
  }
}  
