'use server'

import { db } from '@/db'
// import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'

export const getPaymentStatus = async ({ orderId }: { orderId: string }) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      billingAddress: true,
      shippingAddress: true,
      configuration: true,
    },
  })

  if (!order) throw new Error("Order not found")

  return order.isPaid ? order : false
}


