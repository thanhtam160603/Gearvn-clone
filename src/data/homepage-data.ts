import type { IconType } from "react-icons";
import {
  FaBoxOpen,
  FaComputerMouse,
  FaGamepad,
  FaHeadphones,
  FaKeyboard,
  FaLaptop,
  FaMemory,
  FaMicrochip,
  FaNetworkWired,
  FaRegNewspaper,
  FaShieldHalved,
  FaStore,
} from "react-icons/fa6";
import { BsDeviceSsd, BsGpuCard } from "react-icons/bs";
import { MdChair, MdMonitor, MdOutlineCable, MdReceiptLong } from "react-icons/md";

export type HomepageCategory = {
  id: string;
  label: string;
  icon: IconType;
};

export type HeaderLink = {
  label: string;
  href: string;
  icon: IconType;
};

export type HeroSlide = {
  id: string;
  src: string;
  alt: string;
};

export const homepageCategories: HomepageCategory[] = [
  { id: "laptop", label: "Laptop", icon: FaLaptop },
  { id: "laptop-gaming", label: "Laptop Gaming", icon: FaGamepad },
  { id: "pc-gvn", label: "PC GVN", icon: MdMonitor },
  { id: "main-cpu-vga", label: "Main, CPU, VGA", icon: BsGpuCard },
  { id: "case-nguon-tan", label: "Case, Nguồn, Tản", icon: FaBoxOpen },
  { id: "storage-memory", label: "Ổ cứng, RAM, Thẻ nhớ", icon: BsDeviceSsd },
  { id: "audio-video", label: "Loa, Micro, Webcam", icon: FaHeadphones },
  { id: "monitor", label: "Màn hình", icon: MdMonitor },
  { id: "keyboard", label: "Bàn phím", icon: FaKeyboard },
  { id: "mouse", label: "Chuột + Lót chuột", icon: FaComputerMouse },
  { id: "headset", label: "Tai nghe", icon: FaHeadphones },
  { id: "chair-desk", label: "Ghế - Bàn", icon: MdChair },
  { id: "software-network", label: "Phần mềm, mạng", icon: FaNetworkWired },
  { id: "console", label: "Handheld, Console", icon: FaGamepad },
  { id: "accessories", label: "Phụ kiện (Hub, sạc, cáp...)", icon: MdOutlineCable },
  { id: "services", label: "Dịch vụ và thông tin khác", icon: FaMicrochip },
];

export const quickLinks: HeaderLink[] = [
  { label: "Tất cả danh mục khuyến mãi", href: "#khuyen-mai", icon: FaMemory },
  { label: "Tin tức, review sản phẩm", href: "#tin-tuc", icon: FaRegNewspaper },
  { label: "Tra cứu bảo hành", href: "#bao-hanh", icon: FaShieldHalved },
  { label: "Tra cứu hóa đơn", href: "#hoa-don", icon: MdReceiptLong },
  { label: "Hệ thống Showroom", href: "#showroom", icon: FaStore },
];

export const heroSlides: HeroSlide[] = [
  { id: "flash-sale", src: "/gear_1.webp", alt: "Flash Sale ngập tràn ưu đãi" },
  { id: "monitor", src: "/gear_2.webp", alt: "Màn hình chính hãng giảm đến 51 phần trăm" },
  { id: "gaming-mouse", src: "/gear_3.webp", alt: "Chuột gaming ưu đãi chỉ từ 80 nghìn đồng" },
  { id: "pc-rtx-5090", src: "/gear_4.webp", alt: "PC RTX 5090 tặng màn hình OLED" },
];

export const promoBanners: HeroSlide[] = [
  { id: "laptop-promo", src: "/banner_laptop__1_.webp", alt: "Mua laptop nhận bộ quà tặng gaming" },
  { id: "pc-promo", src: "/banner_pc__1_.webp", alt: "Build PC nhận ưu đãi màn hình" },
];

export const promoBanners1: HeroSlide[] = [
  { id: "monitor-promo", src: "/banner_monitor_1_.webp", alt: "Màn hình gaming giảm giá đến 50 phần trăm" },
  { id: "laptop-promo", src: "/banner_laptop__1_.webp", alt: "Mua laptop nhận bộ quà tặng gaming" },
  { id: "pc-promo", src: "/banner_pc__1_.webp", alt: "Build PC nhận ưu đãi màn hình" },
];

export const heroRightBanners = [
  { id: "biuld-pc",
    src: "/right-banner-1.webp",
    alt: "Build PC tặng màn 240Hz",
  },
  { id: "keyboard-promo",
    src: "/right-banner-2.webp",
    alt: "Bàn phím máy tính t7/2026",
  },
  { id: "pc-i5/5090",
    src: "/right-banner-3.webp",
    alt: "Tặng màn Gaming 200Hz",
  },
  { id: "laptop-gaming",
    src: "/right-banner-4.webp",
    alt: "Hè săn Lap giá top",
  },
];

export const heroBottomBanners = [
  {
    id: "flash-sale",
    src: "/gear_1.webp",
    alt: "FLASH SALE tháng 8",
  },
  {
    id: "monitor-sale",
    src: "/gear_2.webp",
    alt: "Màn hình giảm giá t7/2026",
  },
  {
    id: "mouse-sale",
    src: "/gear_3.webp",
    alt: "Chuột gaming giảm giá",
  },
  {
    id: "pc-rtx-5090",
    src: "/gear_4.webp",
    alt: "PC RTX 5090 tặng màn hình OLED",
  },
]