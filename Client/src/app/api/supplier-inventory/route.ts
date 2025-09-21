import { NextResponse } from "next/server";

// This is a mock API route for supplier inventory management.
// Replace with real DB logic or connect to your backend as needed.

let products = [
  {
    id: "1",
    name: "Premium Whey Protein Powder",
    description: "High-quality whey protein isolate.",
    price: 4149,
    stock_quantity: 100,
    inStock: true,
  },
  {
    id: "2",
    name: "Yoga Mat",
    description: "Eco-friendly, non-slip yoga mat.",
    price: 999,
    stock_quantity: 50,
    inStock: true,
  },
];

export async function GET() {
  return NextResponse.json(products);
}

export async function PUT(request: Request) {
  const { id, stock_quantity, inStock } = await request.json();
  products = products.map((p) =>
    p.id === id ? { ...p, stock_quantity, inStock } : p
  );
  return NextResponse.json({ success: true });
}
