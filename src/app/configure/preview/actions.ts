'use server';

import { BASE_PRICE, PRODUCT_PRICES } from "@/config/products";
import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Order } from "@prisma/client";

export const createCheckoutSession = async ({configId,}:{configId:string})=>{
   const configuration = await db.configuration.findUnique({
    where:{id:configId},
   })
   if(!configuration){
    throw new Error('No such configuration found')
}
const { getUser } = getKindeServerSession();
const user = await getUser();

if (!user || !user.id) {
  console.error("No user returned from Kinde:", user);
  throw new Error("You must be logged in to checkout.");
}

    let dbUser = await db.user.findUnique({
        where: { id: user.id },
      });
      
      if (!dbUser) {
        dbUser = await db.user.create({
          data: {
            id: user.id,
            email: user.email || "", // if needed
            // any other required fields here
          },
        });
      }
      

    const {finish,material} = configuration

    let price = BASE_PRICE
    if(finish === 'textured') price += PRODUCT_PRICES.finish.textured
    if(material === 'polycarbonate') price += PRODUCT_PRICES.material.polycarbonate

    let order: Order | undefined = undefined

    const existingOrder = await db.order.findFirst({
        where:{
            userId:user.id,
            configurationId: configuration.id,
        }
    })
    if(existingOrder){
        order = existingOrder
    }else{
        order = await db.order.create({
            data:{
                amount: price/100,
                userId: user.id,
                configurationId: configuration.id
            }
        })
    }
    const product = await stripe.products.create({
        name: 'Custom Phone Case',
        images:[configuration.imageUrl],
        default_price_data:{
            currency: 'GBP',
            unit_amount: price,
        }
    })
    const  stripeSession = await stripe.checkout.sessions.create({
        success_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/thank-you?orderId=${order.id}`,
        cancel_url:`${process.env.NEXT_PUBLIC_SERVER_URL}/configure/preview?id=${configuration.id}`,
        payment_method_types:['card','paypal'],
        mode:'payment',
        shipping_address_collection: {allowed_countries:['GB','US']},
        metadata:{
            userId: user.id,
            orderId: order.id,
        },
        line_items: [{price: product.default_price as string, quantity: 1}]
    })
    return {url:stripeSession.url}
}