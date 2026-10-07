import Image from "next/image";
import Link from "next/link";
import type { CollectionConfig } from "@/types/collection";

type CollectionHeaderProps = {
  collection: CollectionConfig;
};

export default function CollectionHeader({ 
    collection 
}: CollectionHeaderProps) {
    return (
        <section>
            <nav className="mb-3 text-sm text-neutral-500">
                <Link href="/" className="hover:underline">
                    Trang chủ
                </Link>
                <span className="mx-2">/</span>
                <span>{collection.breadcrumbLabel}</span>
            </nav>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
                {collection.title}
            </h1>
            <p className="mt-2 text-neutral-700">
                {collection.description}
            </p>
            {collection.banner && (
                <div className="relative mt-5 h-40 overflow-hidden rounded-xl sm:h-52 lg:h-64">
                    <Image
                        src={collection.banner.src}
                        alt={collection.banner.alt}
                        fill
                        sizes="(max-width: 1023px) 100vw, 1200px"
                        className="object-cover"
                    />
                </div>
            )}
        </section>
    );
}