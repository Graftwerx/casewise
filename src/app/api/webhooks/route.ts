import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) {
    console.error("Missing Stripe signature");
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
  
    return new Response('Webhook error', { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email;
    const metadata = session.metadata;

    if (!email || !metadata?.userId || !metadata?.orderId) {
      console.error("Missing required metadata or email:", { email, metadata });
      return new Response("Missing metadata or email", { status: 400 });
    }

    const billingAddress = session.customer_details!.address;
    const shippingAddress = session.shipping_details!.address;

    try {
      await db.order.update({
        where: { id: metadata.orderId },
        data: {
          isPaid: true,
          shippingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: shippingAddress?.city || "",
              country: shippingAddress?.country || "",
              postalCode: shippingAddress?.postal_code || "",
              street: shippingAddress?.line1 || "",
              state: shippingAddress?.state || "",
            },
          },
          billingAddress: {
            create: {
              name: session.customer_details!.name!,
              city: billingAddress?.city || "",
              country: billingAddress?.country || "",
              postalCode: billingAddress?.postal_code || "",
              street: billingAddress?.line1 || "",
              state: billingAddress?.state || "",
            },
          },
        },
      });

      console.log(`✅ Order ${metadata.orderId} marked as paid`);
    } catch (err) {
      console.error("Error updating order:", err);
      return new Response("Error updating order", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
