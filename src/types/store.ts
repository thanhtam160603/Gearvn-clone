

export type ProductCategory =
  | "laptop"
  | "pc"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headset"
  | "accessory";

export type Category = {
  id: "all" | ProductCategory;
  label: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  originalPrice: number;
  reviews: number;
  badge: string;
  accent: [string, string];
  imageLabel: string;
};