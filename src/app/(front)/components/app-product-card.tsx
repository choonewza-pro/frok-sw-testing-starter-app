'use client'

import { formatPrice } from "@/lib/format";

type Props = {
  name: string;
  price: number;
  stock?: number;
  onAddToCart: (name: string) => void;
}

export default function AppProductCard({ name, price, stock = 0, onAddToCart }: Props) {
  const inStock = stock > 0;

  return (
    <div
      className="w-60 border border-green-500 rounded-lg p-6 m-6 bg-amber-100"
      data-testid="app-product-card"
    >
      <h2 data-testid="app-product-name">{name}</h2>
      <p data-testid="app-product-price">ราคา: {formatPrice(price)} บาท</p>
      {inStock && (
        <div>
          <p data-testid="app-product-stock">คงเหลือ: {stock}</p>
          <button data-testid="app-product-add" onClick={() => onAddToCart(name)}>
            เพิ่มลงตะกร้า
          </button>
        </div>
      )}
    </div>
  );
}
