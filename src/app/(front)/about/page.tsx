import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Server,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const stats = [
  { icon: ShoppingBag, value: "50+", label: "สินค้าในระบบ" },
  { icon: GraduationCap, value: "10+", label: "หลักสูตรออนไลน์" },
  { icon: Users, value: "1,200+", label: "ผู้เรียนสะสม" },
  { icon: CheckCircle2, value: "99.9%", label: "ความพร้อมใช้งาน" },
];

const features = [
  {
    icon: ShoppingBag,
    title: "ระบบร้านค้าครบวงจร",
    description:
      "ค้นหาสินค้า จัดการตะกร้า และชำระเงิน ด้วยประสบการณ์ใช้งานที่ลื่นไหลบนทุกอุปกรณ์",
  },
  {
    icon: BookOpen,
    title: "หลักสูตรออนไลน์",
    description:
      "รวมคอร์สเรียนด้านการพัฒนาเว็บ ดึงข้อมูลจาก API จริง พร้อมจัดการกรณีข้อผิดพลาดอย่างเหมาะสม",
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัยและเชื่อถือได้",
    description:
      "ระบบสมาชิกและสิทธิ์การเข้าถึงผ่าน Better Auth แยกส่วนผู้ดูแลระบบออกจากผู้ใช้ทั่วไปอย่างชัดเจน",
  },
  {
    icon: Sparkles,
    title: "ออกแบบเพื่อการเรียนรู้",
    description:
      "แยกตรรกะออกจากเฟรมเวิร์ก ทำให้โค้ดอ่านง่าย ทดสอบได้ และเป็นตัวอย่างที่ดีสำหรับผู้เริ่มต้น",
  },
];

const values = [
  {
    title: "เรียบง่าย",
    description: "ตัดสิ่งที่ไม่จำเป็นออก เหลือไว้เฉพาะสิ่งที่ผู้ใช้ต้องการจริง ๆ",
  },
  {
    title: "โปร่งใส",
    description: "ทุกขั้นตอนตรวจสอบได้ ตั้งแต่ข้อมูลสินค้าไปจนถึงสถานะคำสั่งซื้อ",
  },
  {
    title: "พัฒนาต่อเนื่อง",
    description: "รับฟังความคิดเห็นและปรับปรุงระบบอยู่เสมอในทุกรอบการพัฒนา",
  },
];

const techStack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Prisma",
  "SQLite",
  "Better Auth",
  "Zustand",
];

async function ApiVersion() {
  let version: string | null = null;

  try {
    const response = await fetch("https://api.codingthailand.com/api/version");
    const apiInfo = await response.json();
    version = apiInfo?.data?.version ?? null;
  } catch {
    version = null;
  }

  if (!version) {
    return (
      <span className="text-sm text-muted-foreground">
        ไม่สามารถเชื่อมต่อ API ได้ในขณะนี้
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <span className="text-sm text-muted-foreground">
        API Version{" "}
        <span className="font-medium text-foreground">{version}</span>
      </span>
    </div>
  );
}

// http://localhost:3000/about
export default function AboutPage() {
  return (
    <main className="px-6 py-20">
      <div className="mx-auto w-full max-w-5xl">
        {/* Hero */}
        <section className="text-center">
          <Badge className="rounded-full border-border py-1" variant="secondary">
            เกี่ยวกับเรา <Sparkles className="ml-1 size-4" />
          </Badge>

          <h1 className="mx-auto mt-6 max-w-2xl font-medium text-4xl tracking-[-0.045em] sm:text-[2.75rem]/[1.2]">
            แพลตฟอร์มเรียนรู้และช้อปปิ้งในที่เดียว
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground tracking-[-0.01em] sm:text-xl">
            เราสร้างระบบ E-Commerce ต้นแบบสำหรับการเรียนการสอน
            ที่รวมทั้งร้านค้าออนไลน์และหลักสูตรพัฒนาเว็บไว้ด้วยกัน
            เพื่อให้ผู้เรียนได้เห็นตัวอย่างการทำงานจริงตั้งแต่หน้าบ้านจนถึงหลังบ้าน
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="rounded-full" size="lg">
              <Link href="/product">
                ดูสินค้าทั้งหมด <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full shadow-none"
              size="lg"
              variant="outline"
            >
              <Link href="/contact">ติดต่อเรา</Link>
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-18 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl border p-5 text-center">
              <Icon
                aria-hidden="true"
                className="mx-auto size-5 text-muted-foreground"
              />
              <p className="mt-3 font-medium text-3xl tracking-[-0.03em]">
                {value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="mt-18">
          <h2 className="text-center font-medium text-3xl tracking-[-0.035em]">
            สิ่งที่เราให้บริการ
          </h2>
          <p className="mt-3 text-center text-muted-foreground">
            ครอบคลุมทุกส่วนของระบบ ตั้งแต่การซื้อขายไปจนถึงการเรียนรู้
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border p-6 transition-colors hover:border-foreground/20"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-medium text-lg tracking-[-0.015em]">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="mt-18 rounded-2xl border bg-muted/30 p-8 sm:p-10">
          <h2 className="text-center font-medium text-3xl tracking-[-0.035em]">
            สิ่งที่เรายึดถือ
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {values.map(({ title, description }, index) => (
              <div key={title}>
                <span className="font-medium text-muted-foreground text-sm">
                  0{index + 1}
                </span>
                <h3 className="mt-2 font-medium text-lg tracking-[-0.015em]">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech stack + API status */}
        <section className="mt-18 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-6 lg:col-span-2">
            <h3 className="font-medium text-sm text-muted-foreground tracking-[-0.015em]">
              เทคโนโลยีที่ใช้
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {techStack.map((tech) => (
                <Badge key={tech} className="py-1" variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Server aria-hidden="true" className="size-4" />
              <h3 className="font-medium text-sm tracking-[-0.015em]">
                สถานะระบบ
              </h3>
            </div>
            <div className="mt-4">
              <Suspense
                fallback={
                  <div className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    <span className="text-sm text-muted-foreground">
                      กำลังตรวจสอบ...
                    </span>
                  </div>
                }
              >
                <ApiVersion />
              </Suspense>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-18 rounded-2xl border p-10 text-center">
          <h2 className="font-medium text-3xl tracking-[-0.035em]">
            พร้อมเริ่มต้นกับเราแล้วหรือยัง?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            เลือกชมสินค้าหรือหลักสูตรที่สนใจ แล้วเริ่มต้นการเรียนรู้ได้ทันที
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild className="rounded-full" size="lg">
              <Link href="/course">
                ดูหลักสูตร <ArrowUpRight className="h-5! w-5!" />
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-full shadow-none"
              size="lg"
              variant="outline"
            >
              <Link href="/">กลับหน้าแรก</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
