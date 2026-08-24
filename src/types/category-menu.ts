export type CategoryGroup ={
    title: string;
    items: string[];
}

export type CategoryMenu = {
    id: string;
    title: string;
    groups: CategoryGroup[];
}