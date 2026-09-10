export type ProductSectionId =
  | "pc"
  | "laptop-gaming"
  | "laptop-van-phong"
  | "mouse"
  | "keyboard"
  | "monitor"
  | "case-cooling-psu"
  | "mainboard"
  | "storage"
  | "audio-video"
  | "headset"
  | "chair-desk"
  | "software-network"
  | "console"
  | "accessories"
  | "services";

export type ProductStatus =
  | "in-stock"
  | "out-of-stock"
  | "pre-order";

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductSpecGroup = {
  title: string;
  items: ProductSpec[];
};

export type ProductVariant = {
  id: string;
  label: string;
  value: string;
  priceDifference?: number;
};

export type ProductBundle = {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  salePrice: number;
};

export type ProductContentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  images?: string[];
};

export type ProductFilterAttributeKey =
  // Thuộc tính dùng cho các nhóm sản phẩm trên trang chủ
  | "cpu"
  | "gpu"
  | "vga"
  | "ram"
  | "ssd"
  | "mainboard"
  | "screen"
  | "size"
  | "panel"
  | "resolution"
  | "refreshRate"
  | "backlight"
  | "connection"
  | "dpi"
  | "weight"
  | "feature"
  | "layout"
  | "productType"
  | "color"
  | "caseSize"
  | "motherboardSupport"
  | "wattage"
  | "efficiency"
  | "modular"
  | "coolerType"
  | "radiatorSize"
  | "socketSupport"
  | "cpuBrand"
  | "socket"
  | "chipset"
  | "ramType"
  | "formFactor"
  | "wifi"
  | "memorySlots"
  | "capacity"
  | "interface"
  | "protocol"
  | "useCase";

export type ProductFilterAttributes = Partial<
  Record<ProductFilterAttributeKey, string[]>
>;

export type Product = {
  // Định danh và điều hướng
  id: string;
  slug: string;
  section: ProductSectionId;
  sku: string;

  // Nội dung cơ bản
  name: string;
  brand: string;
  shortDescription?: string;
  description?: string;

  // Hình ảnh
  image: string;
  images: string[];

  // Giá
  originalPrice?: number;
  salePrice: number;
  discount?: number;

  // Phân loại và lọc
  tags: string[];
  filterAttributes?: ProductFilterAttributes;

  // Thông tin bán hàng
  status: ProductStatus;
  stockQuantity: number;
  warranty?: string;
  promotion?: string;

  // Thông số hiển thị nhanh trên card
  highlights?: string[];

  // Thông số nổi bật hiển thị ở đầu trang chi tiết
  featuredSpecs?: ProductSpec[];

  // Thông số đầy đủ trên trang chi tiết
  specificationGroups?: ProductSpecGroup[];

  // Các lựa chọn của sản phẩm
  variants?: ProductVariant[];

  bundles?: ProductBundle[];
  contentSections?: ProductContentSection[];

  // Đánh giá
  rating?: number;
  reviewCount?: number;
};

export type ProductTab = {
  id: string;
  label: string;
};

export type ProductSectionConfig = {
  id: ProductSectionId;
  title: string;
  promo: string;
  tabs: ProductTab[];
  rows: 1 | 2;
  viewAllHref: string;
};
