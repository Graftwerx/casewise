import { db } from "@/db";
import { notFound } from "next/navigation";
import React from "react";
import DesignPreview from "./DesignPreview";

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

const Page = async ({ searchParams }: PageProps) => {
  // Ensure `id` is correctly extracted as a string
  const id = typeof searchParams.id === "string" ? searchParams.id : undefined;

  if (!id) {
    return notFound();
  }

  // Fetch configuration from the database
  const configuration = await db.configuration.findUnique({
    where: { id },
  });

  if (!configuration) {
    return notFound();
  }

  return <DesignPreview configuration={configuration} />;
};

export default Page;
