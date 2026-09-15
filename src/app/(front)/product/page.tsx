import { existsSync } from "node:fs";
import { join } from "node:path";
import FeaturesProduct from "@/components/features-product";
import prisma from "@/lib/prisma";
import { connection } from "next/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const PAGE_SIZE = 10;

// http://localhost:3000/product
export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connection(); // signals this is a dynamic route
  const { q = "", page = "1" } = await searchParams;

  const query = typeof q === "string" ? q.trim() : "";
  const pageNumber = Math.max(1, parseInt(typeof page === "string" ? page : "1", 10) || 1);

  const where = query
    ? { name: { contains: query } }
    : {};

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: { product_images: true },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.products.count({ where }),
  ]);

  // แปลง Decimal → number ก่อนส่งให้ Client Component
  const imageDir = join(process.cwd(), "public", "product-image");
  const serializedProducts = products.map((p) => {
    const picture = p.product_images[0]?.image_name ?? null;
    return {
      ...p,
      price: Number(p.price), // Decimal → number
      picture,
      hasImage: picture !== null && existsSync(join(imageDir, picture)),
    }
  })

  return (
    <main>
      <FeaturesProduct
        products={serializedProducts}
        q={query}
        page={pageNumber}
        total={total}
        pageSize={PAGE_SIZE}
      />
    </main>
  );
}