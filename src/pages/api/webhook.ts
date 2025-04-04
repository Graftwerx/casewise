// File: /src/pages/api/webhook.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { buffer } from 'micro'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/db'
import {Resend} from 'resend'
import OrderReceivedEmail from '@/components/emails/OrderReceivedEmail'

export const config = {
  api: {
    bodyParser: false,
  },
}

const resend = new Resend(process.env.RESEND_API_KEY)

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req)

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Stripe signature error:', err)
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, orderId } = session.metadata ?? {}

    if (!userId || !orderId) {
      console.error('❌ Missing metadata')
      return res.status(400).end()
    }

    const name = session.customer_details?.name
    const billing = session.customer_details?.address
    const shipping = session.shipping_details?.address

    if (!name || !billing || !shipping) {
      console.error('❌ Missing address info')
      return res.status(400).end()
    }

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

    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        billingAddressId: billingRecord.id,
        shippingAddressId: shippingRecord.id,
      },
    })
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error('❌ Missing customer email');
      return res.status(400).end();
    }
    
    await resend.emails.send({
      from: 'CaseWise <graftwerx@gmail.com>',
      to: [customerEmail],
      subject: 'Thanks for your order',
      react: OrderReceivedEmail({
        orderId,
        orderDate: updatedOrder.createdAt.toLocaleDateString(),
        // @ts-expect-error shipping address exists
        shippingAddress: {
          name,
          street: shipping.line1 ?? '',
          city: shipping.city ?? '',
          country: shipping.country ?? '',
          postalCode: shipping.postal_code ?? '',
          state: shipping.state ?? '',
        },
      }),
    });
    

    console.log('✅ Order updated successfully:', orderId)
  }

  res.json({ received: true })
}

export default handler
