import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import CartButton from "@/app/(front)/components/CartButton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { PRODUCT_PLACEHOLDER_SRC } from "@/lib/product/product-placeholder";
import type { ProductViewModel } from "@/types/product";

type Props = {
  products: ProductViewModel[];
};

const FeaturedProducts = ({ products }: Props) => {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-medium text-3xl tracking-[-0.04em] sm:text-4xl">
            สินค้าแนะนำ
          </h2>
          <p className="mt-2 text-muted-foreground">
            คัดสินค้ายอดนิยมมาให้เลือกก่อนใคร
          </p>
        </div>
        <Button asChild className="rounded-full shadow-none" variant="outline">
          <Link href="/product">
            ดูสินค้าทั้งหมด <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div
        data-testid="featured-product-list"
        className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-testid="featured-product-card"
            data-product-id={product.id}
            className="group flex flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20"
          >
            <div className="relative mb-4 aspect-4/5 w-full overflow-hidden rounded-lg">
              <Image
                alt={
                  product.picture
                    ? product.name
                    : `${product.name} (ไม่มีภาพสินค้า)`
                }
                className="size-full bg-muted object-cover transition-transform duration-300 group-hover:scale-105"
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                src={
                  product.picture
                    ? `/product-image/${product.picture}`
                    : PRODUCT_PLACEHOLDER_SRC
                }
                unoptimized={!product.picture}
              />
            </div>

            <h3 className="line-clamp-2 font-medium text-base tracking-[-0.005em]">
              {product.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
              {product.description}
            </p>
            <p className="mt-3 font-medium text-lg text-primary">
              {formatPrice(product.price)} บาท
            </p>

            <div className="mt-auto">
              <CartButton product={product} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
