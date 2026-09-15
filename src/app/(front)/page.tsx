import { ArrowUpRight, BookOpen, Headset, Sparkles } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import FeaturedProducts from "@/components/featured-products";
import Hero from "@/components/hero";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import prisma from "@/lib/prisma";
import { fileSystemImageExists } from "@/lib/product/product-image";
import { getProductList } from "@/lib/product/product-service";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const FEATURED_PRODUCT_COUNT = 4;

async function FeaturedProductsSection() {
  await connection(); // อ่านฐานข้อมูลจริง จึงเป็น dynamic

  const { products } = await getProductList(
    {},
    {
      prisma,
      imageExists: fileSystemImageExists,
      pageSize: FEATURED_PRODUCT_COUNT,
    }
  );

  return <FeaturedProducts products={products} />;
}

function FeaturedProductsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <Skeleton className="h-10 w-48" />
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: FEATURED_PRODUCT_COUNT }, (_, index) => (
          <Skeleton className="h-96 w-full" key={index} />
        ))}
      </div>
    </section>
  );
}

// http://localhost:3000/
export default function Home() {
  return (
    <main>
      <Hero />

      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProductsSection />
      </Suspense>

      {/* แถบโปรโมตหลักสูตร */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border bg-muted/30 p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen aria-hidden="true" className="size-4" />
                <span className="font-medium text-sm tracking-[-0.015em]">
                  หลักสูตรออนไลน์
                </span>
              </div>
              <h2 className="mt-3 text-balance font-medium text-3xl tracking-[-0.04em] sm:text-4xl">
                เรียนสร้างเว็บแอปพลิเคชันจากโปรเจกต์จริง
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                ตั้งแต่พื้นฐาน React และ Next.js ไปจนถึงการเชื่อมต่อฐานข้อมูลและระบบสมาชิก
                พร้อมตัวอย่างโค้ดที่นำไปใช้ต่อได้ทันที
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild className="rounded-full" size="lg">
                  <Link href="/course">
                    ดูหลักสูตรทั้งหมด <ArrowUpRight className="h-5! w-5!" />
                  </Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full shadow-none"
                  size="lg"
                  variant="outline"
                >
                  <Link href="/about">เกี่ยวกับเรา</Link>
                </Button>
              </div>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-sm lg:grid-cols-1">
              <div className="rounded-xl border bg-background p-5">
                <Sparkles
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
                <h3 className="mt-3 font-medium tracking-[-0.015em]">
                  อัปเดตเนื้อหาต่อเนื่อง
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  ตามเวอร์ชันล่าสุดของเฟรมเวิร์กที่ใช้งานจริง
                </p>
              </div>
              <div className="rounded-xl border bg-background p-5">
                <Headset aria-hidden="true" className="size-5 text-primary" />
                <h3 className="mt-3 font-medium tracking-[-0.015em]">
                  มีทีมงานคอยช่วยเหลือ
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  สอบถามผ่านหน้าติดต่อเรา ตอบกลับภายใน 1-2 วันทำการ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
