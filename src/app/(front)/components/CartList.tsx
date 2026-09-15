"use client"

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCartStore } from "@/lib/cart/cart-store";
import { lineTotal } from "@/lib/cart/cart-logic";
import { formatPrice } from "@/lib/format";
import { Trash } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CartList() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalPrice = useCartStore((state) => state.totalPrice());

  const handleCheckout = () => {
    clearCart();
    router.replace("/product");
  };

  if (items.length === 0) {
    return (
      <div className="text-center mt-20" data-testid="cart-empty">
        ตะกร้าสินค้าว่างเปล่า...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl mt-20" data-testid="cart-list">
      <h1 className="text-xl mb-4">ตะกร้าสินค้า</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>รหัสสินค้า</TableHead>
            <TableHead>ชื่อสินค้า</TableHead>
            <TableHead>ราคา</TableHead>
            <TableHead>จำนวน</TableHead>
            <TableHead>รวม</TableHead>
            <TableHead>เครื่องมือ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.productId}
              data-testid="cart-row"
              data-product-id={item.productId}
            >
              <TableCell>{item.productId}</TableCell>
              <TableCell data-testid="cart-item-name">{item.name}</TableCell>
              <TableCell>{formatPrice(item.price)}</TableCell>
              <TableCell data-testid="cart-item-qty">{item.qty}</TableCell>
              <TableCell data-testid="cart-item-total">
                {formatPrice(lineTotal(item))}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  data-testid="cart-remove-item"
                  onClick={() => removeItem(item.productId)}
                >
                  <Trash />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-right mt-5">
        <div className="font-bold text-2xl" data-testid="cart-total">
          รวมทั้งหมด: {formatPrice(totalPrice)}
        </div>
        <div className="m-4">
          <Button
            className="mr-4"
            variant="outline"
            data-testid="cart-clear"
            onClick={clearCart}
          >
            ลบสินค้าทั้งหมด
          </Button>
          <Button data-testid="cart-checkout" onClick={handleCheckout}>
            ยืนยันการสั่งซื้อ
          </Button>
        </div>
      </div>
    </div>
  );
}
