import headphones from "@/assets/product-headphones.jpg";
import sneakers from "@/assets/product-sneakers.jpg";
import watch from "@/assets/product-watch.jpg";
import backpack from "@/assets/product-backpack.jpg";
import mug from "@/assets/product-mug.jpg";
import lamp from "@/assets/product-lamp.jpg";
import sunglasses from "@/assets/product-sunglasses.jpg";
import bottle from "@/assets/product-bottle.jpg";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

export const categories = [
  "All",
  "Electronics",
  "Fashion",
  "Accessories",
  "Home",
  "Lifestyle",
] as const;

export const products: Product[] = [
  { id: "1", name: "Wireless Headphones", price: 129.0, category: "Electronics", image: headphones },
  { id: "2", name: "Runner Sneakers", price: 89.5, category: "Fashion", image: sneakers },
  { id: "3", name: "Smart Watch Pulse", price: 199.0, category: "Electronics", image: watch },
  { id: "4", name: "Leather Backpack", price: 74.0, category: "Fashion", image: backpack },
  { id: "5", name: "Ceramic Mug", price: 12.0, category: "Home", image: mug },
  { id: "6", name: "Studio Desk Lamp", price: 58.0, category: "Home", image: lamp },
  { id: "7", name: "Aviator Sunglasses", price: 45.0, category: "Accessories", image: sunglasses },
  { id: "8", name: "Insulated Bottle", price: 24.0, category: "Lifestyle", image: bottle },
];
