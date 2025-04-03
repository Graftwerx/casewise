import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { HTMLAttributes } from "react";

interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string;
  dark?: boolean;
}

const Phone = ({ imgSrc, className, dark = false, ...props }: PhoneProps) => {
  return (
    <div
      className={cn(
        "relative pointer-events-none z-50 overflow-hidden",
        className
      )}
      {...props}
    >
      <Image
        src={
          dark
            ? "/phone-template-dark-edges.png"
            : "/phone-template-white-edges.png"
        }
        alt="phone image"
        className="pointer-events-none z-50 select-none"
        width={570}
        height={500}
      />
      <div className="absolute -z-10 inset-0">
        <Image
          src={imgSrc}
          alt="phone overlay"
          className="object-cover rounded-md"
          width={570}
          height={500}
        />
      </div>
    </div>
  );
};

export default Phone;
