// productCache.ts
type ProductCache = {
  userID: string | null;
  url: string | null;
  type: string | null;
  price: string[];
  images: string[];
  title: string | null;
  descriptions: string[];
  techDetails: string[];
  techDescription: string[];
};

const cache: ProductCache = {
  userID: null,
  url: null,
  type: null,
  price: [],
  images: [],
  title: null,
  descriptions: [],
  techDetails: [],
  techDescription: []
};

export const productCache = {
  get: () => cache,
  update: (partial: Partial<ProductCache>) => Object.assign(cache, partial),
  reset: () => {
    Object.keys(cache).forEach((key) => {
      if (Array.isArray(cache[key as keyof ProductCache])) {
        (cache[key as keyof ProductCache] as string[]) = [];
      } else {
        cache[key as keyof ProductCache] = null;
      }
    });
  }
};
