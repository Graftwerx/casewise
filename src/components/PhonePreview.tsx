"use client";

import { CaseColor } from "@prisma/client";
import React, { useEffect, useRef, useState } from "react";
import { AspectRatio } from "./ui/aspect-ratio";
import { cn } from "@/lib/utils";
import Image from "next/image";

const PhonePreview = ({
  croppedImageUrl,
  color,
}: {
  croppedImageUrl: string;
  color: CaseColor;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [renderedDimensions, setRenderedDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleResize = () => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setRenderedDimensions({ width, height });
  };

  useEffect(() => {
    handleResize(); // Initial measure
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set case background color
  const caseBackgroundColor =
    {
      blue: "bg-blue-950",
      rose: "bg-rose-950",
      black: "bg-zinc-950",
    }[color] ?? "bg-zinc-950";

  // Only render image when dimensions are ready
  const isReady = renderedDimensions.width > 0 && renderedDimensions.height > 0;

  return (
    <AspectRatio ratio={3000 / 2001} className="relative">
      <div ref={ref} className="absolute inset-0">
        {isReady && (
          <div
            className="absolute z-20 scale-[1.0352]"
            style={{
              left:
                renderedDimensions.width / 2 -
                renderedDimensions.width / (1216 / 121),
              top: renderedDimensions.height / 6.22,
            }}
          >
            <Image
              alt="phone-preview"
              src={croppedImageUrl}
              width={renderedDimensions.width / (3000 / 637)}
              height={renderedDimensions.height / (2001 / 1216)}
              className={cn(
                "phone-skew relative z-20 rounded-t-[15px] rounded-b-[10px] md:rounded-t-[30px] md:rounded-b-[20px]",
                caseBackgroundColor
              )}
            />
          </div>
        )}

        <div className="relative h-full w-full z-40">
          <Image
            alt="phone"
            src="/clearphone.png"
            fill
            className="pointer-events-none h-full w-full antialiased rounded-md"
          />
        </div>
      </div>
    </AspectRatio>
  );
};

export default PhonePreview;
