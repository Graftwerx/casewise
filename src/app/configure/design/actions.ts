'use server'

import { db } from '@/db'
import { CaseColor,CaseFinish,CaseMaterial,PhoneModel } from '@prisma/client'
 // Define CaseFinish if it is not exported by @prisma/client
//  export type CaseFinish = 'smooth' | 'textured'  // Replace with actual values

//  // Define CaseMaterial if it is not exported by @prisma/client
//  export type CaseMaterial = 'silicone' | 'polycarbonate' // Replace with actual values

// // Define PhoneModel if it is not exported by @prisma/client
// export type PhoneModel = 'iPhonex' | 'iPhone11' | 'iPhone12'| 'iPhone13'| 'iPhone14'| 'iPhone15' // Replace with actual values

// export type CaseColor = 'black' | 'blue' | 'rose' // Replace with actual values if different


export type SaveConfigArgs = {
    color: CaseColor
    finish: CaseFinish
    material: CaseMaterial
    model: PhoneModel
    configId: string
}

export async function saveConfig({color, finish, material, model, configId}:SaveConfigArgs){
   await db.configuration.update({
    where:{id:configId},
    data: {color,finish,material,model},
   })  
}

export { CaseMaterial, PhoneModel }
