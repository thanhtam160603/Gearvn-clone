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