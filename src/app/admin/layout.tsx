import type { Metadata } from "next";
import { Prompt, Roboto, Lora } from "next/font/google";
import { cn } from "@/lib/utils";
import { ToastContainer } from "react-toastify";
import AdminNav from "./components/AdminNav";
import "react-toastify/dist/ReactToastify.css";
import "../globals.css";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const loraHeading = Lora({ subsets: ["latin"], variable: "--font-heading" });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" });
const promptFont = Prompt({
  weight: ["400", "500", "700"],
  subsets: ["thai"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ผู้ดูแลระบบ | CodingThailand",
  description: "จัดการสินค้าและดูภาพรวมของร้าน",
};

// โปรเจกต์นี้ไม่มี root layout ร่วม แต่ละ route group ต้องมี <html>/<body> ของตัวเอง
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      className={cn(promptFont.className, "font-sans", roboto.variable, loraHeading.variable)}
    >
      <body>
        <AdminNav />
        <main className="mx-auto w-full max-w-(--breakpoint-xl) px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </body>
    </html>
  );
}
