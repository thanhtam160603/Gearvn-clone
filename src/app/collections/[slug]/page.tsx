import {notFound} from "next/navigation";

import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/common/AppFooter";
import CollectionToolbar from "@/components/collections/CollectionToolbar";
import CollectionProductGrid from "@/components/collections/CollectionProductGrid";
import CollectionPagination from "@/components/collections/CollectionPagination";
import CollectionHeader from "@/components/collections/CollectionHeader";
import CollectionFilterSidebar from "@/components/collections/CollectionFilterSidebar";

import {
    collectionConfigs,
    getCollectionBySlug,
} from "@/data/collection-configs";

import {
  COLLECTION_PAGE_SIZE,
  getCollectionProducts,
  filterCollectionProducts,
  sortCollectionProducts,
  paginateCollectionProducts,
  getCollectionFilterOptions,
} from "@/lib/collection";


import {
  parseCollectionQuery,
  buildCollectionQuery,
} from "@/lib/collection-query";

import type { CollectionSearchParams } from "@/lib/collection-query";

type CollectionPageProps = {
    params: Promise<{
        slug: string;
    }>;
    searchParams: Promise<CollectionSearchParams>;
};

export async function generateStaticParams() {
    return collectionConfigs.map((config) => ({
        slug: config.slug,
    }));
}

export default async function CollectionPage({
    params,
    searchParams,
}: CollectionPageProps) {
    const { slug } = await params;
    const collection = getCollectionBySlug(slug);

    if (!collection) {
        notFound();
    }

    const query = parseCollectionQuery(
        await searchParams, 
        collection
    );

    const baseProducts = getCollectionProducts(collection);

    const filteredProducts = filterCollectionProducts(baseProducts, query.filters);

    const sortedProducts = sortCollectionProducts(filteredProducts, query.sort);

    const paginatedProducts = paginateCollectionProducts(sortedProducts, query.page, COLLECTION_PAGE_SIZE);

    const filterOptions = getCollectionFilterOptions(baseProducts, collection);

    const collectionHref = `/collections/${collection.slug}`;

    const queryString = buildCollectionQuery(
        {...query,
            page: paginatedProducts.page,
        },
        collection
    );
    return (
        <>
        <AppHeader />
        <main className="container-shell flex-1 py-6">
            <CollectionHeader collection={collection} />
            <div className="mt-6 flex items-start gap-5">
                <CollectionFilterSidebar
                config={collection}
                options={filterOptions}
                value={query.filters}
            />

                <div className="min-w-0 flex-1">
                    <CollectionToolbar
                        key={collection.slug}
                        config={collection}
                        options={filterOptions}
                        filter={query.filters}
                        sort={query.sort}
                        totalItems={filteredProducts.length}
                    />

                    <CollectionProductGrid
                        products={paginatedProducts.items}
                        collectionHref={collectionHref}
                        isCollectionEmpty={baseProducts.length === 0}
                    />

                    <CollectionPagination
                        pathname={collectionHref}
                        queryString={queryString}
                        page={paginatedProducts.page}
                        totalPages={paginatedProducts.totalPages}
                    />
                </div>
            </div>
            
        
            {/* <CollectionFilterPanel
                config={collection}
                options={filterOptions}
                value={query.filters}
                open={false}
                onClose={() => {}}
            /> */}
        </main>
        <AppFooter />

        </>
    )
}
