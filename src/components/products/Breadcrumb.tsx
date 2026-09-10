import { Product } from "@/types/product";
import Link from "next/link";

type BreadcrumbProps ={
    section: Product["section"];
    productName: string;
}
const sectionLabels: Record<Product["section"], {
    label: string; href: string;
}> = {
    pc: { label: "PC", href: "/products/pc" },
    "laptop-gaming": { label: "Laptop Gaming", href: "/products/laptop-gaming" },
    "laptop-van-phong": { label: "Laptop Văn Phòng", href: "/products/laptop-van-phong" },
    mouse: { label: "Chuột", href: "/products/mouse" },
    keyboard: { label: "Bàn phím", href: "/products/keyboard" },
    monitor: { label: "Màn hình", href: "/products/monitor" },
    "case-cooling-psu": {
        label: "Case, Nguồn, Tản nhiệt",
        href: "/collections/case-nguon-tan-nhiet",
    },
    mainboard: { label: "Mainboard", href: "/collections/mainboard" },
    storage: { label: "Ổ cứng SSD", href: "/collections/o-cung-ssd" },
    "audio-video": { label: "Loa, Micro, Webcam", href: "/collections/audio-video" },
    headset: { label: "Tai nghe", href: "/collections/headset" },
    "chair-desk": { label: "Ghế - Bàn", href: "/collections/chair-desk" },
    "software-network": { label: "Phần mềm, mạng", href: "/collections/software-network" },
    console: { label: "Handheld, Console", href: "/collections/console" },
    accessories: { label: "Phụ kiện", href: "/collections/accessories" },
    services: { label: "Dịch vụ", href: "/collections/services" },
}

export default function Breadcrumb({ section, productName }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-neutral-500">
                <li>
                <Link href="/">Trang chủ</Link>
                </li>

                <li aria-hidden="true">/</li>

                <li>
                <Link href={sectionLabels[section].href}>
                    {sectionLabels[section].label}
                </Link>
                </li>

                <li aria-hidden="true">/</li>

                <li
                className="max-w-[260px] truncate text-neutral-900"
                aria-current="page"
                >
                {productName}
                </li>
            </ol>
        </nav>
    )
}
