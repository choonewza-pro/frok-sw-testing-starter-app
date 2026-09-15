"use client"

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart/cart-store";
import type { ProductViewModel } from "@/types/product";
import { ChevronRight } from "lucide-react";

type Props = {
  product: Pick<ProductViewModel, "id" | "name" | "price">
}

export default function CartButton({ product }: Props) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddItem = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: 1,
    });
  };

  return (
    <Button
      className="mt-6 shadow-none"
      onClick={handleAddItem}
      data-testid="add-to-cart"
    >
      หยิบใส่ตะกร้า <ChevronRight />
    </Button>
  );
}
