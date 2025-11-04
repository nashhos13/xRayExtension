// productCache.ts
// productCache.ts
export type ProductCache = {
  userID: string | null;
  url: string | null;
  type: string | null;
  price: string[];
  images: Array<string | {
    element?: HTMLImageElement;
    src: string;
    alt: string;
    currentSrc: string;
    lazySrc: string | null;
  }>;
  title: string | null;
  descriptions: string[];
  techDetails: string[];
  techDescription: string;
};

// Mutable cache object - exported so other modules can read/write the same reference
export const productCache: ProductCache = {
  userID: null,
  url: null,
  type: null,
  price: [],
  images: [],
  title: null,
  descriptions: [],
  techDetails: [],
  techDescription: ""
};

// Helper API for safe operations against the above cache
export const productCacheAPI = {
  get: () => productCache as ProductCache,
  update: (partial: Partial<ProductCache>) => Object.assign(productCache, partial),
  reset: () => {
    productCache.userID = null;
    productCache.url = null;
    productCache.type = null;
    productCache.price.length = 0;
    productCache.images.length = 0;
    productCache.title = null;
    productCache.descriptions.length = 0;
    productCache.techDetails.length = 0;
    productCache.techDescription = "";
  }
};
