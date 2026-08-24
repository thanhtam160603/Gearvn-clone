"use client";

import { type Product } from "@/types/product";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import { useRef, useState, type MouseEvent } from "react";

type ProductInformationProps = {
  product: Product;
};

export default function ProductInformation({ product }: ProductInformationProps) {
    // const [isExpanded, setIsExpanded] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const sections = product.contentSections ?? [];
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const handleSectionClick = (
        event: MouseEvent<HTMLAnchorElement>,
        sectionId: string,
    ) => {
        event.preventDefault();

        const sectionElement = sectionRefs.current[sectionId];

        if (!sectionElement) return;

        const headerOffset = 80;
        const sectionTop =
            sectionElement.getBoundingClientRect().top +
            window.scrollY -
            headerOffset;

        window.scrollTo({
            top: sectionTop,
            behavior: "smooth",
        });
    };

    return (
        <section className="bg-neutral-100 items-start border border-neutral-200 rounded-xl p-5 mt-6">
            <div className="flex-1 min-w-0 flex flex-col gap-4">
                <h2 className="text-xl font-bold text-neutral-900">Thông tin sản phẩm</h2>
                <div className="flex flex-col gap-4 p-4">
                    <button className="flex items-center justify-between w-full" type="button" onClick={() => setIsOpen(!isOpen)}>
                        <span className="text-sm font-bold text-neutral-900">Mục lục</span>
                        {isOpen ? (
                            <FaAngleUp className="text-neutral-900" />
                        ) : (
                            <FaAngleDown className="text-neutral-900" />
                        )}
                    </button>
                    {isOpen && sections.map((section) => (
                    <div key={section.id} className="flex flex-col gap-2">
                        <a
                            href={`#${section.id}`}
                            onClick={(event) => handleSectionClick(event, section.id)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {section.title}
                        </a>
                    </div>
                ))}
                </div>
                <div className="relative">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            id={section.id}
                            ref={(element) => {
                                sectionRefs.current[section.id] = element;
                            }}
                            className="mb-4 scroll-mt-24"
                        >
                            <h3 className="text-lg font-semibold text-neutral-900">{section.title}</h3>
                            {section.paragraphs.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}
                        </div>
                    ))}
                </div>
                {/* <button className="" type="button" onClick={() => setIsExpanded(!isExpanded)}>
                    Xem thêm
                </button>  */}
            </div>
        </section>
    )
}
