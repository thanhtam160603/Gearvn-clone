"use client";
import { usePathname } from "next/navigation";
import type { HomepageCategory } from "@/data/homepage-data";
import CategoryMenu from "./CategoryMenu";

type DesktopCategoryOverlayProps = {
    open: boolean;
    categories: HomepageCategory[];
    onClose: () => void;
};

export default function DesktopCategoryOverlay({
    open,
    categories,
    onClose,
}: DesktopCategoryOverlayProps) {
    const pathname = usePathname();
    const isHomepage = pathname === "/";

    if (!open) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 top-[100px] z-[45] hidden lg:block">
            <button
                type="button"
                aria-label="Đóng danh mục sản phẩm"
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />

            {!isHomepage && (
                <div className="container-shell pointer-events-none relative pt-6">
                    <div className="pointer-events-auto w-[280px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm">
                        <CategoryMenu categories={categories} />
                    </div>
                </div>
            )}
        </div>
    );
}