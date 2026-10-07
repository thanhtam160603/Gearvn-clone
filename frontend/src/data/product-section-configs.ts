import type { ProductSectionConfig } from "@/types/product";

export const productSectionConfigs: ProductSectionConfig[] = [
  { id: "pc", title: "PC bán chạy", promo: "Trả góp 0%", rows: 1, viewAllHref: "/products/pc", tabs: [
    { id: "pc-ai", label: "PC AI" }, { id: "pc-i3", label: "PC I3" }, { id: "pc-i5", label: "PC I5" },
    { id: "pc-i7", label: "PC I7" }, { id: "pc-i9", label: "PC I9" }, { id: "pc-r9", label: "PC R9" },
  ] },
  { id: "laptop-gaming", title: "Laptop Gaming bán chạy", promo: "Miễn phí giao hàng", rows: 1, viewAllHref: "/products/laptop-gaming",
    tabs: ["acer", "msi", "lenovo", "asus", "gigabyte"].map((id) => ({ id, label: id.toUpperCase() })) },
  { id: "laptop-van-phong", title: "Laptop văn phòng bán chạy", promo: "Miễn phí giao hàng", rows: 1, viewAllHref: "/products/laptop-van-phong",
    tabs: ["laptop-ai", "asus", "acer", "msi", "lg", "lenovo", "hp"].map((id) => ({ id, label: id === "laptop-ai" ? "Laptop AI" : id.toUpperCase() })) },
  { id: "mouse", title: "Chuột bán chạy", promo: "Giao hàng toàn quốc", rows: 1, viewAllHref: "/products/mouse",
    tabs: ["logitech", "razer", "asus", "corsair", "dareu", "rapoo"].map((id) => ({ id, label: id.toUpperCase() })) },
  { id: "keyboard", title: "Bàn phím bán chạy", promo: "Giao hàng toàn quốc", rows: 1, viewAllHref: "/products/keyboard",
    tabs: ["akko", "asus", "razer", "logitech", "leopold", "dareu", "keychron"].map((id) => ({ id, label: id.toUpperCase() })) },
  { id: "monitor", title: "Màn hình chính hãng", promo: "Bảo hành 1 đổi 1", rows: 2, viewAllHref: "/products/monitor",
    tabs: ["lg", "asus", "viewsonic", "dell", "gigabyte", "aoc"].map((id) => ({ id, label: id.toUpperCase() })) },
];
