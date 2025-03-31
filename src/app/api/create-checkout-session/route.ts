import { NextResponse } from "next/server";
import { createCheckoutSession } from "@/app/configure/preview/actions"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const { configId } = await req.json();

    if (!configId) {
      return NextResponse.json({ error: "Missing configId" }, { status: 400 });
    }

    const session = await createCheckoutSession({ configId });

    return NextResponse.json(session); // { url: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

