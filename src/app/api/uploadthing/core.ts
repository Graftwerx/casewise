


import { createUploadthing, type FileRouter } from "uploadthing/next";
import sharp from 'sharp'
import{z} from 'zod';
import { db } from "@/db";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
  .input(z.object({configId: z.string().optional()}))
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
     return {input}
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const {configId} = metadata.input

      const res = await fetch(file.ufsUrl)
      const buffer = await res.arrayBuffer()

      const imgMetadata = await sharp(buffer).metadata()
      const {width, height} = imgMetadata

      if(!configId){
        const configuration = await db.configuration.create({
          data:{
            imageUrl:file.ufsUrl,
            height: height || 500,
            width: width || 500,
          },
        })
        return{configId: configuration.id}
      }else{
        const updatedConfiguration = await db.configuration.update({
          where:{
            id: configId,
          },
          data:{
            croppedImageUrl: file.ufsUrl,
          }
        })
        return{configId:updatedConfiguration.id}
      }

     
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
