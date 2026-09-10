import type {
    CollectionFilterConfig,
    CollectionFilterSource,
} from "@/types/collection";
import type { ProductSectionId } from "@/types/product";

export type CategoryConfig = {
    id: string;
    slug: string;
    title: string;
    breadcrumbLabel: string;
    description: string;
    sections: ProductSectionId[];
    filters: CollectionFilterConfig[];
    banner?: {
        src: string;
        alt: string;
    };
};

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

export const categoryConfigs: CategoryConfig[] = [
    {
        id: "laptop",
        slug: "laptop",
        title: "Laptop",
        breadcrumbLabel: "Laptop",
        description:
            "Laptop gaming và laptop văn phòng chính hãng cho học tập, làm việc và giải trí.",
        sections: ["laptop-gaming", "laptop-van-phong"],
        banner: { src: "/banner_laptop__1_.webp", alt: "Khuyến mãi laptop GearVN" },
        filters: filters([
            ["cpu", "CPU", "cpu"],
            ["ram", "RAM", "ram"],
            ["ssd", "Ổ cứng SSD", "ssd"],
            ["screen", "Màn hình", "screen"],
            ["vga", "Card đồ họa", "vga"],
        ]),
    },
    {
        id: "laptop-gaming",
        slug: "laptop-gaming",
        title: "Laptop Gaming",
        breadcrumbLabel: "Laptop Gaming",
        description: "Laptop gaming hiệu năng cao, màn hình tần số quét lớn và card đồ họa rời.",
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
        id: "laptop-van-phong",
        slug: "laptop-van-phong-ban-chay",
        title: "Laptop văn phòng bán chạy",
        breadcrumbLabel: "Laptop văn phòng",
        description: "Laptop văn phòng mỏng nhẹ, pin tốt, phù hợp cho học tập và công việc hằng ngày.",
        sections: ["laptop-van-phong"],
        filters: filters([
            ["cpu", "CPU", "cpu"],
            ["ram", "RAM", "ram"],
            ["ssd", "Ổ cứng SSD", "ssd"],
            ["screen", "Màn hình", "screen"],
        ]),
    },
    {
        id: "pc-gvn",
        slug: "pc-gvn",
        title: "PC GVN",
        breadcrumbLabel: "PC GVN",
        description: "PC GVN chính hãng với nhiều cấu hình Intel, AMD và card đồ họa NVIDIA.",
        sections: ["pc"],
        banner: { src: "/banner_pc__1_.webp", alt: "Khuyến mãi PC GearVN" },
        filters: filters([
            ["cpu", "CPU", "cpu"],
            ["mainboard", "Mainboard", "mainboard"],
            ["ram", "RAM", "ram"],
            ["ssd", "Ổ cứng SSD", "ssd"],
            ["vga", "Card đồ họa", "vga"],
        ]),
    },
    {
        id: "mouse",
        slug: "chuot-may-tinh",
        title: "Chuột máy tính",
        breadcrumbLabel: "Chuột máy tính",
        description: "Chuột gaming và chuột văn phòng có dây, không dây từ các thương hiệu phổ biến.",
        sections: ["mouse"],
        filters: filters([
            ["connection", "Kết nối", "connection"],
            ["dpi", "DPI", "dpi"],
            ["weight", "Trọng lượng", "weight"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "keyboard",
        slug: "ban-phim",
        title: "Bàn phím máy tính",
        breadcrumbLabel: "Bàn phím",
        description: "Bàn phím cơ, bàn phím gaming và bàn phím văn phòng chính hãng.",
        sections: ["keyboard"],
        filters: filters([
            ["connection", "Kết nối", "connection"],
            ["layout", "Layout", "layout"],
            ["backlight", "Đèn nền", "backlight"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "monitor",
        slug: "man-hinh",
        title: "Màn hình máy tính",
        breadcrumbLabel: "Màn hình",
        description: "Màn hình gaming, màn hình đồ họa và màn hình văn phòng chính hãng.",
        sections: ["monitor"],
        banner: { src: "/banner_monitor_1_.webp", alt: "Khuyến mãi màn hình GearVN" },
        filters: filters([
            ["size", "Kích thước", "size"],
            ["panel", "Tấm nền", "panel"],
            ["resolution", "Độ phân giải", "resolution"],
            ["refresh-rate", "Tần số quét", "refreshRate"],
        ]),
    },
    {
        id: "case-nguon-tan",
        slug: "case-nguon-tan-nhiet",
        title: "Case, Nguồn, Tản nhiệt",
        breadcrumbLabel: "Case, Nguồn, Tản nhiệt",
        description: "Case máy tính, nguồn và tản nhiệt chính hãng dành cho nhiều cấu hình.",
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
        id: "mainboard",
        slug: "mainboard",
        title: "Mainboard - Bo mạch chủ",
        breadcrumbLabel: "Mainboard",
        description: "Mainboard Intel và AMD chính hãng với nhiều lựa chọn chipset và chuẩn RAM.",
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
        id: "storage-memory",
        slug: "o-cung-ssd",
        title: "Ổ cứng SSD và HDD",
        breadcrumbLabel: "Ổ cứng SSD",
        description: "Ổ cứng SSD, HDD chính hãng cho máy tính và laptop.",
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
    {
        id: "main-cpu-vga",
        slug: "main-cpu-vga",
        title: "Main, CPU, VGA",
        breadcrumbLabel: "Main, CPU, VGA",
        description: "Linh kiện nền tảng và card đồ họa cho máy tính để bàn.",
        sections: ["mainboard", "pc"],
        filters: filters([
            ["cpu", "CPU", "cpu"],
            ["mainboard", "Mainboard", "mainboard"],
            ["vga", "Card đồ họa", "vga"],
            ["ram", "RAM", "ram"],
        ]),
    },
    {
        id: "audio-video",
        slug: "audio-video",
        title: "Loa, Micro, Webcam",
        breadcrumbLabel: "Loa, Micro, Webcam",
        description: "Thiết bị âm thanh và hình ảnh cho giải trí, học tập và livestream.",
        sections: ["audio-video"],
        filters: filters([
            ["product-type", "Loại sản phẩm", "productType"],
            ["connection", "Kết nối", "connection"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "headset",
        slug: "headset",
        title: "Tai nghe",
        breadcrumbLabel: "Tai nghe",
        description: "Tai nghe gaming, Bluetooth và tai nghe chụp tai chính hãng.",
        sections: ["headset"],
        filters: filters([
            ["product-type", "Loại tai nghe", "productType"],
            ["connection", "Kết nối", "connection"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "chair-desk",
        slug: "chair-desk",
        title: "Ghế - Bàn",
        breadcrumbLabel: "Ghế - Bàn",
        description: "Ghế công thái học, ghế gaming và bàn làm việc cho góc máy.",
        sections: ["chair-desk"],
        filters: filters([
            ["product-type", "Loại sản phẩm", "productType"],
            ["color", "Màu sắc", "color"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "software-network",
        slug: "software-network",
        title: "Phần mềm, mạng",
        breadcrumbLabel: "Phần mềm, mạng",
        description: "Phần mềm bản quyền và thiết bị mạng cho gia đình, văn phòng.",
        sections: ["software-network"],
        filters: filters([
            ["product-type", "Loại sản phẩm", "productType"],
            ["connection", "Kết nối", "connection"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "console",
        slug: "console",
        title: "Handheld, Console",
        breadcrumbLabel: "Handheld, Console",
        description: "Máy chơi game console, handheld và phụ kiện giải trí.",
        sections: ["console"],
        filters: filters([
            ["product-type", "Loại sản phẩm", "productType"],
            ["connection", "Kết nối", "connection"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "accessories",
        slug: "accessories",
        title: "Phụ kiện",
        breadcrumbLabel: "Phụ kiện",
        description: "Hub, sạc, cáp và phụ kiện tiện ích cho máy tính, laptop.",
        sections: ["accessories"],
        filters: filters([
            ["product-type", "Loại sản phẩm", "productType"],
            ["connection", "Kết nối", "connection"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
    {
        id: "services",
        slug: "services",
        title: "Dịch vụ và thông tin khác",
        breadcrumbLabel: "Dịch vụ",
        description: "Các dịch vụ hỗ trợ lắp ráp, nâng cấp và chăm sóc máy tính.",
        sections: ["services"],
        filters: filters([
            ["product-type", "Loại dịch vụ", "productType"],
            ["use-case", "Nhu cầu sử dụng", "useCase"],
            ["feature", "Tính năng", "feature"],
        ]),
    },
];

export function getCategoryBySlug(slug: string) {
    return categoryConfigs.find((category) => category.slug === slug);
}
