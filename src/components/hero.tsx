import { ArrowUpRight, GraduationCap, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
  { icon: Truck, title: "ส่งฟรีทั่วไทย", description: "เมื่อสั่งซื้อครบ 1,000 บาท" },
  { icon: ShieldCheck, title: "ชำระเงินปลอดภัย", description: "รองรับบัตรเครดิตและโอนผ่านธนาคาร" },
  { icon: RotateCcw, title: "คืนสินค้าได้ 7 วัน", description: "ไม่พอใจยินดีคืนเงินเต็มจำนวน" },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-24 sm:py-28">
      {/* แสงพื้นหลังแบบไล่สี ใช้ div ธรรมดาเพื่อให้ยังเป็น Server Component */}
      <div
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute inset-0"
      >
        <div className="-translate-x-1/2 absolute top-[-10rem] left-1/2 size-[36rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[-8rem] bottom-[-12rem] size-[28rem] rounded-full bg-chart-1/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <Badge
          asChild
          className="rounded-full border-border py-1"
          variant="secondary"
        >
          <Link href="/product">
            สินค้าใหม่กว่า 50 รายการ <ArrowUpRight className="ml-1 size-4" />
          </Link>
        </Badge>

        <h1 className="mx-auto mt-6 max-w-2xl text-balance font-medium text-4xl tracking-[-0.04em] sm:text-[2.75rem] md:text-6xl/[1.15]">
          ช้อปสินค้าคุณภาพ พร้อมเรียนรู้ไปด้วยกัน
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl/relaxed">
          ระบบ E-Commerce CodingThailand รวมร้านค้าออนไลน์และหลักสูตรพัฒนาเว็บไว้ในที่เดียว
          เลือกซื้อสินค้าที่ชอบ หรือเริ่มต้นเรียนรู้การสร้างเว็บแอปพลิเคชันได้ทันที
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button asChild className="rounded-full" size="lg">
            <Link href="/product">
              เลือกซื้อสินค้า <ArrowUpRight className="h-5! w-5!" />
            </Link>
          </Button>
          <Button
            asChild
            className="rounded-full shadow-none"
            size="lg"
            variant="outline"
          >
            <Link href="/course">
              <GraduationCap className="h-5! w-5!" /> ดูหลักสูตร
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
        {highlights.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border bg-card/60 p-5 text-center backdrop-blur-sm sm:text-start"
          >
            <Icon
              aria-hidden="true"
              className="mx-auto size-5 text-primary sm:mx-0"
            />
            <h2 className="mt-3 font-medium text-base tracking-[-0.015em]">
              {title}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
