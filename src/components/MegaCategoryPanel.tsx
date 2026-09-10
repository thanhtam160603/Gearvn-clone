import Link from "next/link";
import { CategoryMenu } from "@/types/category-menu";

type MegaCategoryPanelProps = {
    menu: CategoryMenu;
    href: string;
};


export default function MegaCategoryPanel({ menu, href }: MegaCategoryPanelProps) {
    return (
        <div className="absolute left-[260px] top-0 shrink-0 px-6 z-[45] ">
            <div className="bg-white shadow-lg border border-neutral-200 rounded-lg max-h-[556px]" style={{ width: "912px" }}>
                <div className="flex flex-col gap-2 h-full p-6">
                    <div className="flex items-center font-bold justify-between py-4">
                        <h3>{menu.title}</h3>
                        <Link href={href} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="flex flex-1 flex-col gap-8 overflow-y-auto min-h-0">
                        <div className="flex flex-wrap  gap-x-8 gap-y-7">
                            {menu.groups.map((group) => (
                                <div key={group.title} className="flex flex-col gap-2">
                                    <a href={group.title} className="text-sm font-bold text-gray-700 hover:text-blue-600">
                                        {group.title}
                                    </a>
                                    <ul className="flex flex-col gap-1">
                                        {group.items.map((item) => (
                                            <li key={item}>
                                                <a href={item}
                                                    className="text-sm text-gray-600 hover:text-blue-600"
                                                >
                                                    {item}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}