/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import CartButton from "@/app/(front)/components/CartButton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PRODUCT_PLACEHOLDER_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e7e5e4"/>
      <stop offset="1" stop-color="#d6d3d1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#g)"/>
  <g fill="none" stroke="#a8a29e" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" opacity="0.6">
    <path d="M300 260l160 93v185l-160 93-160-93V353z"/>
    <path d="M300 260l160 93-160 93-160-93z"/>
    <path d="M300 446v185"/>
  </g>
</svg>`.trim()
)}`;

type Props = {
  products: any[]
  q: string
  page: number
  total: number
  pageSize: number
}

const FeaturesProduct = ({ products, q, page, total, pageSize }: Props) => {
  const router = useRouter();
  const [search, setSearch] = useState(q);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildUrl = (nextQ: string, nextPage: number) => {
    const params = new URLSearchParams();
    if (nextQ) params.set("q", nextQ);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/product?${qs}` : "/product";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl(search.trim(), 1));
  };

  const goToPage = (p: number) => {
    router.push(buildUrl(q, p));
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col px-6 py-20">
      <h2 className="text-pretty text-center font-medium text-4xl tracking-[-0.04em] sm:text-[2.75rem]">
        สินค้าทั้งหมด
      </h2>

      <form onSubmit={handleSearch} className="mx-auto mt-8 flex w-full max-w-md gap-2">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาด้วยชื่อสินค้า..."
        />
        <Button type="submit" className="shrink-0 shadow-none">
          <Search className="size-4" /> ค้นหา
        </Button>
      </form>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-foreground/70">
          ไม่พบสินค้าที่ค้นหา
        </p>
      ) : (
        <>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div className="rounded-xl border bg-card px-6 py-7" key={product.id}>

                <div className="relative mb-5 aspect-4/5 w-full overflow-hidden rounded-xl sm:mb-6">
                  {product.picture && product.hasImage ? (
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
                <h3 className="mt-5 font-medium text-lg tracking-[-0.005em]">
                  Name: {product.name}
                </h3>
                <p className="mt-2 text-base text-foreground/70">
                  Price: {product.price.toString()}
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
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="text-sm text-foreground/70">
              หน้า {page} จาก {totalPages} ({total} รายการ)
            </span>

            <Button
              variant="outline"
              size="icon"
              className="shadow-none"
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
