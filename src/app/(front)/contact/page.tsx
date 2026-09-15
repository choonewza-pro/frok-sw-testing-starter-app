import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "./contact-form";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const contactInfo = [
  {
    icon: MapPin,
    label: "ที่อยู่",
    value: "123 ถนนตัวอย่าง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500",
  },
  { icon: Phone, label: "โทรศัพท์", value: "02-123-4567" },
  { icon: Mail, label: "อีเมล", value: "contact@codingthailand.com" },
  { icon: Clock, label: "เวลาทำการ", value: "จันทร์ - ศุกร์ 09:00 - 18:00 น." },
];

const socialLinks = [
  { label: "Facebook", href: "https://facebook.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Twitter / X", href: "https://x.com" },
];

const faqs = [
  {
    question: "ตอบกลับภายในกี่วัน?",
    answer: "ทีมงานจะตอบกลับภายใน 1-2 วันทำการหลังจากได้รับข้อความ",
  },
  {
    question: "รองรับภาษี/ใบกำกับภาษีไหม?",
    answer: "รองรับใบกำกับภาษีอย่างง่ายสำหรับลูกค้าที่เป็นนิติบุคคล",
  },
  {
    question: "มีบริการส่งสินค้านอกพื้นที่ไหม?",
    answer: "จัดส่งทั่วประเทศผ่านบริษัทขนส่งเอกชนชั้นนำ",
  },
  {
    question: "ติดต่อสอบถามหลักสูตรได้ที่ช่องทางไหน?",
    answer: "สามารถสอบถามหลักสูตรได้ทางฟอร์มด้านขวาหรืออีเมล contact@codingthailand.com",
  },
];

// http://localhost:3000/contact
export default function ContactPage() {
  return (
    <div className="flex min-h-screen items-start justify-center px-6 py-20">
      <div className="w-full grow sm:max-w-(--breakpoint-md) lg:max-w-(--breakpoint-lg)">
        <h2 className="mx-auto text-center font-medium text-4xl tracking-[-0.045em] sm:text-[2.75rem]/[1.2]">
          ติดต่อเรา
        </h2>
        <p className="mt-3 text-pretty text-center text-lg text-muted-foreground tracking-[-0.01em] sm:text-2xl">
          สอบถามข้อมูลเพิ่มเติมหรือติดต่อทีมงาน
        </p>

        <div className="mx-auto mt-18 grid max-w-5xl gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-xl border p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                    <h3 className="text-sm font-medium tracking-[-0.015em]">
                      {label}
                    </h3>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border p-5">
              <h3 className="text-sm font-medium tracking-[-0.015em] text-muted-foreground">
                ติดตามเรา
              </h3>
              <div className="mt-3 flex gap-3">
                {socialLinks.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-full border px-4 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-5">
              <h3 className="text-sm font-medium tracking-[-0.015em] text-muted-foreground">
                คำถามที่พบบ่อย
              </h3>
              <div className="mt-3 space-y-2">
                {faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-lg border px-4 py-3"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <span className="text-muted-foreground transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
