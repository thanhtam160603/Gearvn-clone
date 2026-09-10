import type {
  CollectionConfig,
  CollectionFilterConfig,
  CollectionFilterSource,
} from "@/types/collection";

const priceFilter: CollectionFilterConfig = {
  id: "price",
  label: "Khoảng giá",
  source: "price",
  type: "price-range",
};

const brandFilter: CollectionFilterConfig = {
  id: "brand",
  label: "Thương hiệu",
  source: "brand",
  type: "checkbox",
};

function checkboxFilter(
  id: string,
  label: string,
  source: CollectionFilterSource,
): CollectionFilterConfig {
  return { id, label, source, type: "checkbox" };
}

function filters(
  specs: Array<[id: string, label: string, source: CollectionFilterSource]>,
): CollectionFilterConfig[] {
  return [
    priceFilter,
    brandFilter,
    ...specs.map(([id, label, source]) => checkboxFilter(id, label, source)),
  ];
}

export const collectionConfigs: CollectionConfig[] = [
  {
    slug: "laptop",
    title: "Laptop",
    breadcrumbLabel: "Laptop",
    description:
      "Laptop gaming và laptop văn phòng chính hãng cho học tập, làm việc và giải trí.",
    sections: ["laptop-gaming", "laptop-van-phong"],
    banner: {
      src: "/banner_laptop__1_.webp",
      alt: "Khuyến mãi laptop GearVN",
    },
    filters: filters([
      ["cpu", "CPU", "cpu"],
      ["ram", "RAM", "ram"],
      ["ssd", "Ổ cứng SSD", "ssd"],
      ["screen", "Màn hình", "screen"],
      ["vga", "Card đồ họa", "vga"],
    ]),
  },
  {
    slug: "laptop-gaming",
    title: "Laptop Gaming",
    breadcrumbLabel: "Laptop Gaming",
    description:
      "Laptop gaming hiệu năng cao, màn hình tần số quét lớn và card đồ họa rời.",
    sections: ["laptop-gaming"],
    filters: filters([
      ["cpu", "CPU", "cpu"],
      ["vga", "Card đồ họa", "vga"],
      ["ram", "RAM", "ram"],
      ["ssd", "Ổ cứng SSD", "ssd"],
      ["screen", "Màn hình", "screen"],
    ]),
  },
  {
    slug: "laptop-van-phong-ban-chay",
    title: "Laptop văn phòng bán chạy",
    breadcrumbLabel: "Laptop văn phòng",
    description:
      "Laptop văn phòng mỏng nhẹ, pin tốt, phù hợp cho học tập và công việc hằng ngày.",
    sections: ["laptop-van-phong"],
    filters: filters([
      ["cpu", "CPU", "cpu"],
      ["ram", "RAM", "ram"],
      ["ssd", "Ổ cứng SSD", "ssd"],
      ["screen", "Màn hình", "screen"],
    ]),
  },
  {
    slug: "pc-gvn",
    title: "PC GVN",
    breadcrumbLabel: "PC GVN",
    description:
      "PC GVN chính hãng với nhiều cấu hình Intel, AMD và card đồ họa NVIDIA.",
    sections: ["pc"],
    banner: {
      src: "/banner_pc__1_.webp",
      alt: "Khuyến mãi PC GearVN",
    },
    filters: filters([
      ["cpu", "CPU", "cpu"],
      ["mainboard", "Mainboard", "mainboard"],
      ["ram", "RAM", "ram"],
      ["ssd", "Ổ cứng SSD", "ssd"],
      ["vga", "Card đồ họa", "vga"],
    ]),
  },
  {
    slug: "chuot-may-tinh",
    title: "Chuột máy tính",
    breadcrumbLabel: "Chuột máy tính",
    description:
      "Chuột gaming và chuột văn phòng có dây, không dây từ các thương hiệu phổ biến.",
    sections: ["mouse"],
    filters: filters([
      ["connection", "Kết nối", "connection"],
      ["dpi", "DPI", "dpi"],
      ["weight", "Trọng lượng", "weight"],
      ["feature", "Tính năng", "feature"],
    ]),
  },
  {
    slug: "ban-phim",
    title: "Bàn phím máy tính",
    breadcrumbLabel: "Bàn phím",
    description:
      "Bàn phím cơ, bàn phím gaming và bàn phím văn phòng chính hãng.",
    sections: ["keyboard"],
    filters: filters([
      ["connection", "Kết nối", "connection"],
      ["layout", "Layout", "layout"],
      ["backlight", "Đèn nền", "backlight"],
      ["feature", "Tính năng", "feature"],
    ]),
  },
  {
    slug: "man-hinh",
    title: "Màn hình máy tính",
    breadcrumbLabel: "Màn hình",
    description:
      "Màn hình gaming, màn hình đồ họa và màn hình văn phòng chính hãng.",
    sections: ["monitor"],
    banner: {
      src: "/banner_monitor_1_.webp",
      alt: "Khuyến mãi màn hình GearVN",
    },
    filters: filters([
      ["size", "Kích thước", "size"],
      ["panel", "Tấm nền", "panel"],
      ["resolution", "Độ phân giải", "resolution"],
      ["refresh-rate", "Tần số quét", "refreshRate"],
    ]),
  },
  {
    slug: "case-nguon-tan-nhiet",
    title: "Case, Nguồn, Tản nhiệt",
    breadcrumbLabel: "Case, Nguồn, Tản nhiệt",
    description:
      "Case máy tính, nguồn và tản nhiệt chính hãng dành cho cấu hình gaming, làm việc và sáng tạo nội dung.",
    sections: ["case-cooling-psu"],
    filters: filters([
      ["product-type", "Loại sản phẩm", "productType"],
      ["color", "Màu sắc", "color"],
      ["case-size", "Kích thước case", "caseSize"],
      ["motherboard-support", "Mainboard hỗ trợ", "motherboardSupport"],
      ["wattage", "Công suất nguồn", "wattage"],
      ["efficiency", "Chứng nhận nguồn", "efficiency"],
      ["modular", "Kiểu cáp nguồn", "modular"],
      ["cooler-type", "Loại tản nhiệt", "coolerType"],
      ["radiator-size", "Kích thước radiator", "radiatorSize"],
      ["socket-support", "Socket hỗ trợ", "socketSupport"],
    ]),
  },
  {
    slug: "mainboard",
    title: "Mainboard - Bo mạch chủ",
    breadcrumbLabel: "Mainboard",
    description:
      "Mainboard Intel và AMD chính hãng với nhiều lựa chọn chipset, kích thước và chuẩn RAM.",
    sections: ["mainboard"],
    filters: filters([
      ["cpu-brand", "Nền tảng CPU", "cpuBrand"],
      ["socket", "Socket", "socket"],
      ["chipset", "Chipset", "chipset"],
      ["ram-type", "Chuẩn RAM", "ramType"],
      ["form-factor", "Kích thước", "formFactor"],
      ["wifi", "Wi-Fi", "wifi"],
      ["memory-slots", "Số khe RAM", "memorySlots"],
    ]),
  },
  {
    slug: "o-cung-ssd",
    title: "Ổ cứng SSD và HDD",
    breadcrumbLabel: "Ổ cứng SSD",
    description:
      "Ổ cứng SSD, HDD chính hãng cho máy tính và laptop, đa dạng dung lượng và chuẩn kết nối.",
    sections: ["storage"],
    filters: filters([
      ["product-type", "Loại ổ cứng", "productType"],
      ["capacity", "Dung lượng", "capacity"],
      ["interface", "Chuẩn kết nối", "interface"],
      ["form-factor", "Kích thước", "formFactor"],
      ["protocol", "Giao thức", "protocol"],
      ["use-case", "Nhu cầu sử dụng", "useCase"],
    ]),
  },
];

export function getCollectionBySlug(slug: string) {
  return collectionConfigs.find((collection) => collection.slug === slug);
}
