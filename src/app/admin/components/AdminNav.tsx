import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, Store } from "lucide-react";
import LogoutButton from "@/components/logout-button";

export default function AdminNav() {
  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-(--breakpoint-xl) items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" data-testid="admin-nav-dashboard">
            <Link href="/admin">
              <LayoutDashboard className="size-4" /> ภาพรวม
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" data-testid="admin-nav-products">
            <Link href="/admin/products">
              <Package className="size-4" /> จัดการสินค้า
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" data-testid="admin-nav-shop">
            <Link href="/">
              <Store className="size-4" /> กลับหน้าร้าน
            </Link>
          </Button>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
