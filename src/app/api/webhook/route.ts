import { db } from '@/db'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}


export async function POST(req: Request) {
  try {
    const buffer = await req.arrayBuffer()
    const rawBody = Buffer.from(buffer)

    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return new Response('Missing Stripe signature', { status: 400 })
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'checkout.session.completed') {
      console.log('📦 Stripe checkout.session.completed event received')

      const session = event.data.object as Stripe.Checkout.Session
      const { userId, orderId } = session.metadata ?? {}

      console.log('🧾 Metadata:', { userId, orderId })
      if (!userId || !orderId) throw new Error('Missing metadata')

      const name = session.customer_details?.name
      const billing = session.customer_details?.address
      const shipping = session.shipping_details?.address

      if (!name || !billing || !shipping) {
        throw new Error('Missing customer name or address info')
      }

      console.log('📬 Creating shipping address...')
      const shippingRecord = await db.shippingAddress.create({
        data: {
          name,
          street: shipping.line1 ?? '',
          city: shipping.city ?? '',
          country: shipping.country ?? '',
          postalCode: shipping.postal_code ?? '',
          state: shipping.state ?? '',
        },
      })
      console.log('✅ Shipping address created:', shippingRecord.id)

      console.log('📬 Creating billing address...')
      const billingRecord = await db.billingAddress.create({
        data: {
          name,
          street: billing.line1 ?? '',
          city: billing.city ?? '',
          country: billing.country ?? '',
          postalCode: billing.postal_code ?? '',
          state: billing.state ?? '',
        },
      })
      console.log('✅ Billing address created:', billingRecord.id)

      console.log('📝 Updating order...')
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          billingAddressId: billingRecord.id,
          shippingAddressId: shippingRecord.id,
        },
      })
      console.log('✅ Order updated:', updatedOrder.id)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown webhook error'
    console.error('❌ Webhook Error:', msg)
    return NextResponse.json({ ok: false, message: msg }, { status: 500 })
  }
}
