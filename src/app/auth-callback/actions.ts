'use server'

import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getAuthStatus = async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.id) {
      console.error("No user returned from Kinde:", user);
      throw new Error("You must be logged in to checkout.");
    }
    
        let existingUser = await db.user.findUnique({
            where: { id: user.id },
          });
          
          if (!existingUser) {
            existingUser = await db.user.create({
              data: {
                id: user.id,
                email: user.email || "", // if needed
                // any other required fields here
              },
            });
          }

          return {success:true}
          
}