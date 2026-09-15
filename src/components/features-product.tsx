"use client"

import CartButton from "@/app/(front)/components/CartButton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { PRODUCT_PLACEHOLDER_SRC } from "@/lib/product/product-placeholder";
import { buildProductUrl } from "@/lib/product/product-url";
import type { ProductListResult } from "@/types/product";

type Props = {
  result: ProductListResult
}

const FeaturesProduct = ({ result }: Props) => {
  const { products, q, page, total, totalPages } = result;
  const router = useRouter();
  const [search, setSearch] = useState(q);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildProductUrl(search, 1));
  };

  const goToPage = (nextPage: number) => {
    router.push(buildProductUrl(q, nextPage));
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-6 py-20">
      <h2 className="text-pretty text-center font-medium text-4xl tracking-[-0.04em] sm:text-[2.75rem]">
        สินค้าทั้งหมด
      </h2>

      <form
        onSubmit={handleSearch}
        data-testid="product-search-form"
        className="mx-auto mt-8 flex w-full max-w-md gap-2"
      >
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาด้วยชื่อสินค้า..."
          data-testid="product-search-input"
        />
        <Button type="submit" className="shrink-0 shadow-none" data-testid="product-search-submit">
          <Search className="size-4" /> ค้นหา
        </Button>
      </form>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-foreground/70" data-testid="product-empty">
          ไม่พบสินค้าที่ค้นหา
        </p>
      ) : (
        <>
          <div
            data-testid="product-list"
            className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3"
          >
            {products.map((product) => (
              <div
                className="rounded-xl border bg-card px-6 py-7"
                data-testid="product-card"
                data-product-id={product.id}
                key={product.id}
              >
                <div className="relative mb-5 aspect-4/5 w-full overflow-hidden rounded-xl sm:mb-6">
                  {product.picture ? (
                    <Image
                      alt={product.name}
                      className="size-full bg-muted object-cover"
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={`/product-image/${product.picture}`}
                      loading="eager"
                    />
                  ) : (
                    <Image
                      alt={`${product.name} (ไม่มีภาพสินค้า)`}
                      className="size-full bg-muted object-cover"
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={PRODUCT_PLACEHOLDER_SRC}
                      loading="eager"
                      unoptimized
                    />
                  )}
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary dark:bg-primary/15">
                  ID: {product.id}
                </div>
                <h3
                  className="mt-5 font-medium text-lg tracking-[-0.005em]"
                  data-testid="product-name"
                >
                  Name: {product.name}
                </h3>
                <p className="mt-2 text-base text-foreground/70" data-testid="product-price">
                  Price: {formatPrice(product.price)}
                </p>
                <div className="mt-2">
                  <CartButton product={product} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="shadow-none"
              data-testid="product-prev-page"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="text-sm text-foreground/70" data-testid="product-pagination-status">
              หน้า {page} จาก {totalPages} ({total} รายการ)
            </span>

            <Button
              variant="outline"
              size="icon"
              className="shadow-none"
              data-testid="product-next-page"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default FeaturesProduct;
