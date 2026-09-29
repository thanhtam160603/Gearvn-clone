import {config as loadEnv} from 'dotenv';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { fixtureSchema, attributeKeys, normalize } from '../src/catalog-data'; 

loadEnv({ path: "apps/catalog-service/.env" });

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seed này chỉ dùng cho môi trường phát triển.');
    }
    const connectionString = process.env.CATALOG_DATABASE_URL;
    if (!connectionString) {
        throw new Error('Không tìm thấy biến môi trường CATALOG_DATABASE_URL.');
    }

    const fixture = fixtureSchema.parse(JSON.parse(await readFile(
        resolve("apps/catalog-service/prisma/catalog-fixture.json"), "utf8",
    )));

    for (const key of ["id", "sku", "slug"] as const) {
        const values = fixture.products.map((product) => product[key]);
        if (new Set(values).size !== values.length) {
            throw new Error(`Các giá trị của trường ${key} không duy nhất trong fixture.`);
        }
    }
    
    const prisma = new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
    });

    const productIds = new Map<string, string>();

    const sectionTitles = new Map(fixture.sections.map((s) => [s.id, s.title]));

    const labels: Record<string, string> = {
        cpu: "cpu", ram: "ram", ssd: "ssd", vga: "vga",
        screen: "screen", "màn hình": "screen",
        connection: "connection", "kết nối": "connection",
        dpi: "dpi", weight: "weight", "trọng lượng": "weight",
        layout: "layout", backlight: "backlight", panel: "panel",
        resolution: "resolution", "độ phân giải": "resolution",
        "refresh rate": "refreshRate", "tần số quét": "refreshRate",
        mainboard: "mainboard", size: "size", "kích thước": "size",
        color: "color", "case size": "caseSize", "kích thước case": "caseSize",
    };
    try {
        for (const [sortOrder, source] of fixture.products.entries()) {
            await prisma.$transaction(async (tx) => {
                const brand = await tx.brand.upsert({
                    where: { normalizedName: normalize(source.brand) },
                    update: { name: source.brand },
                    create: { name: source.brand, normalizedName: normalize(source.brand) },
                });

                const title = sectionTitles.get(source.section) ?? source.section;

                const category = await tx.category.upsert({
                    where: { slug: source.section },
                    update: { title },
                    create: { slug: source.section, title },
                });

                const data = {
                    name: source.name, slug: source.slug, section: source.section, sortOrder, 
                    brandId: brand.id, categoryId: category.id,
                    shortDescription: source.shortDescription ?? null,
                    description: source.description ?? null,
                    originalPrice: source.originalPrice ?? null,
                    salePrice: source.salePrice, status: source.status,
                    warranty: source.warranty ?? null, promotion: source.promotion ?? null,
                    tags: source.tags, highlights: source.highlights,
                    variants: source.variants, bundles: source.bundles,
                    contentSections: source.contentSections,
                    rating: source.rating ?? null, reviewCount: source.reviewCount,
                };

                const product = await tx.product.upsert({
                    where: { sku: source.sku },
                    update: data,
                    create: {...data, id: source.id, sku: source.sku},
                });
                productIds.set(source.id, product.id);

                await tx.productImage.deleteMany({ where: { productId: product.id } });
                const images = source.images.length ? source.images : [source.image];
                await tx.productImage.createMany({
                    data: images.map((url, position) => ({
                        productId: product.id, url, position,
                    }))
                })
                
                await tx.productSpec.deleteMany({
                    where: { productId: product.id }
                })
                const specs = [
                    ...source.featuredSpecs.map((spec, position) => ({
                        ...spec, productId: product.id, featured: true,
                        groupTitle: "", groupPosition: 0, position,

                    })),
                    ...source.specificationGroups.flatMap((group, groupPosition) => 
                        group.items.map((spec, position) => ({
                            ...spec, productId: product.id, featured: false,
                            groupTitle: group.title, groupPosition, position,
                        }))
                    )
                ];
                if(specs.length) await tx.productSpec.createMany({ data: specs });

                const attributes: Record<string, string[]> = { ...source.filterAttributes };
                for (const spec of source.featuredSpecs) {
                    const key = labels[normalize(spec.label)];
                    if (key && !attributes[key]?.length) attributes[key] = [spec.value];
                }
                const rows = [];
                for (const [key, values] of Object.entries(attributes)) {
                if (!(attributeKeys as readonly string[]).includes(key)) {
                    throw new Error("Thuộc tính không hỗ trợ: " + key);
                }
                const seen = new Set<string>();
                for (const raw of values) {
                    const value = raw.trim();
                    const normalizedValue = normalize(value);
                    if (!normalizedValue || seen.has(normalizedValue)) continue;
                    seen.add(normalizedValue);
                    rows.push({ productId: product.id, key, value, normalizedValue });
                }
            }
            await tx.productAttribute.deleteMany({
                where: { productId: product.id }
            })
            if(rows.length) await tx.productAttribute.createMany({
                data: rows
            });

            await tx.inventory.upsert({
                where: { productId: product.id },
                update: {},
                create: {
                    productId: product.id,
                    available: source.stockQuantity,
                    reserved: 0,
                }
            })    
            });
        }

        for (const source of fixture.collections) {
            await prisma.$transaction(async (tx) => {
                const data ={
                    title: source.title, 
                    breadcrumbLabel: source.breadcrumbLabel,
                    description: source.description,
                    bannerSrc: source.banner?.src ?? null,
                    bannerAlt: source.banner?.alt ?? null,
                    filterDefinitions: source.filters,
                };
                const collection = await tx.collection.upsert({
                    where: { slug: source.slug },
                    update: data,
                    create: {...data, slug: source.slug},
                })

                const members = fixture.products.
                    filter((product) => source.sections.includes(product.section)
                );
                await tx.collectionProduct.deleteMany({
                    where: { collectionId: collection.id }
                });
                if(members.length) {
                    await tx.collectionProduct.createMany({
                        data: members.map((product) => {
                            const productId = productIds.get(product.id);
                            if (!productId) throw new Error(`Không tìm thấy productId cho sản phẩm ${product.id}`);
                            return { collectionId: collection.id, productId };
                        })
                    });
                }
            });
        }
        console.log({
            products: await prisma.product.count(),
            collections: await prisma.collection.count(),
            inventories: await prisma.inventory.count(),
        });
    } finally {
        await prisma.$disconnect();
    }
}

void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});