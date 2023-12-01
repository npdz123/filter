declare module "hierarchy.json" {
  interface Category {
    name: string;
    subcategories: string[];
  }

  interface Area {
    name: string;
    categories: Category[];
  }

  interface Hierarchy {
    areas: Area[];
  }

  const hierarchy: Hierarchy;
  export default hierarchy;
}