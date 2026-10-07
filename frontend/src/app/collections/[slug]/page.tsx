import {notFound} from "next/navigation";
import { getCollection } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";

import AppHeader from "@/components/common/AppHeader";
import AppFooter from "@/components/common/AppFooter";
import CollectionToolbar from "@/components/collections/CollectionToolbar";
import CollectionProductGrid from "@/components/collections/CollectionProductGrid";
import CollectionPagination from "@/components/collections/CollectionPagination";
import CollectionHeader from "@/components/collections/CollectionHeader";
import CollectionFilterSidebar from "@/components/collections/CollectionFilterSidebar";

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

export default async function CollectionPage({
    params,
    searchParams,
}: CollectionPageProps) {
    const { slug } = await params;
    const base = await getCollection(slug).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) notFound();
        throw error;
    });
    const collection = base.collection;

    const query = parseCollectionQuery(
        await searchParams, 
        collection
    );

    const requestedQuery = buildCollectionQuery(query, collection);
    const pageData = requestedQuery ? await getCollection(slug, requestedQuery) : base;
    const filterOptions = pageData.filterOptions;

    const collectionHref = `/collections/${collection.slug}`;

    const queryString = buildCollectionQuery(
        {...query,
            page: pageData.page,
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
                        totalItems={pageData.totalItems}
                    />

                    <CollectionProductGrid
                        products={pageData.items}
                        collectionHref={collectionHref}
                        isCollectionEmpty={base.totalItems === 0}
                    />

                    <CollectionPagination
                        pathname={collectionHref}
                        queryString={queryString}
                        page={pageData.page}
                        totalPages={pageData.totalPages}
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
