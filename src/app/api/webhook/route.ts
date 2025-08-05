import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { Resend } from "resend";
import OrderReceivedEmail from "@/components/emails/OrderReceivedEmail";

export const config = {
  api: {
    bodyParser: false, // required for Stripe raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") as string;

  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await req.text(); // Stripe requires raw body for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const error = err as Error;
    console.error("❌ Stripe signature error:", error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, orderId } = session.metadata ?? {};

    if (!userId || !orderId) {
      console.error("❌ Missing metadata");
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const name = session.customer_details?.name;
    const billing = session.customer_details?.address;
    const shipping = session.shipping_details?.address;
    const customerEmail = session.customer_details?.email;

    if (!name || !billing || !shipping || !customerEmail) {
      console.error("❌ Missing address or email info");
      return NextResponse.json({ error: "Missing customer info" }, { status: 400 });
    }

    // Save shipping address
    const shippingRecord = await db.shippingAddress.create({
      data: {
        name,
        street: shipping.line1 ?? "",
        city: shipping.city ?? "",
        country: shipping.country ?? "",
        postalCode: shipping.postal_code ?? "",
        state: shipping.state ?? "",
      },
    });

    // Save billing address
    const billingRecord = await db.billingAddress.create({
      data: {
        name,
        street: billing.line1 ?? "",
        city: billing.city ?? "",
        country: billing.country ?? "",
        postalCode: billing.postal_code ?? "",
        state: billing.state ?? "",
      },
    });

    // Mark order as paid
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        billingAddressId: billingRecord.id,
        shippingAddressId: shippingRecord.id,
      },
    });

    // Send confirmation email
    await resend.emails.send({
      from: "CaseWise <graftwerx@gmail.com>",
      to: [customerEmail],
      subject: "Thanks for your order",
      react: OrderReceivedEmail({
        orderId,
        orderDate: updatedOrder.createdAt.toLocaleDateString(),
        shippingAddress: {
            name,
            street: shipping.line1 ?? "",
            city: shipping.city ?? "",
            country: shipping.country ?? "",
            postalCode: shipping.postal_code ?? "",
            state: shipping.state ?? "",
            id: "",
            phoneNumber: null
        },
      }),
    });

    console.log("✅ Order updated successfully:", orderId);
  }

  return NextResponse.json({ received: true });
}


