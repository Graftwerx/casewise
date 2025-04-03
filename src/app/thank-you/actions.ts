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

  if (!order) {
    throw new Error('This order does not exist.')
  }

  // You can also limit what gets returned here for security
  if (order.isPaid) {
    return {
      configuration: order.configuration,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      amount: order.amount,
    }
  } else {
    return false
  }
}


