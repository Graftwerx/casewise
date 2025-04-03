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

      const { userId, orderId } = session.metadata ?? {}
      if (!userId || !orderId) throw new Error('Missing metadata')

      const customerName = session.customer_details?.name || 'Unknown'
      const billing = session.customer_details?.address
      const shipping = session.shipping_details?.address

      if (!billing || !shipping) throw new Error('Missing billing/shipping info')

      const shippingRecord = await db.shippingAddress.create({
        data: {
          name: customerName,
          street: shipping.line1 || '',
          city: shipping.city || '',
          country: shipping.country || '',
          postalCode: shipping.postal_code || '',
          state: shipping.state || '',
        },
      })

      const billingRecord = await db.billingAddress.create({
        data: {
          name: customerName,
          street: billing.line1 || '',
          city: billing.city || '',
          country: billing.country || '',
          postalCode: billing.postal_code || '',
          state: billing.state || '',
        },
      })

      await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          billingAddressId: billingRecord.id,
          shippingAddressId: shippingRecord.id,
        },
      })

      console.log(`✅ Webhook success: Order ${orderId} marked as paid`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown webhook error'
    console.error('❌ Webhook Error:', msg)
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
