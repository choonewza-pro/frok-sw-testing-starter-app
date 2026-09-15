import FeaturesProduct from "@/components/features-product";
import prisma from "@/lib/prisma";
import { fileSystemImageExists } from "@/lib/product/product-image";
import { getProductList } from "@/lib/product/product-service";
import { connection } from "next/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// http://localhost:3000/product
export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connection(); // signals this is a dynamic route

  const result = await getProductList(await searchParams, {
    prisma,
    imageExists: fileSystemImageExists,
  });

  return (
    <main>
      <FeaturesProduct result={result} />
    </main>
  );
}
