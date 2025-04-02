import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getPaymentStatus = async ({ orderId }: { orderId: string }) => {
    console.log("🔍 Checking payment status for order:", orderId);
  
    const { getUser } = getKindeServerSession();
    const user = await getUser();
  
    if (!user?.id || !user.email) {
      console.error("🚫 Not logged in");
      throw new Error("You need to be logged in to view this page.");
    }
  
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: {
        billingAddress: true,
        configuration: true,
        shippingAddress: true,
        user: true,
      },
    });
  
    if (!order) {
      console.error("🚫 No order found for user:", user.id);
      throw new Error("This order does not exist.");
    }
  
    if (order.isPaid) {
      console.log("✅ Order is paid:", order.id);
      return order;
    } else {
      console.log("⏳ Order not paid yet:", order.id);
      return false;
    }
  };
  

