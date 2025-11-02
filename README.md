# xRay Chrome Extension

A Chrome extension that helps users scan and analyze products across different e-commerce platforms.

Built with Manifest V3, TypeScript, React 18, Webpack 5, and PostCSS.

## Getting Started

1. `npm i` to install dependencies
2. `npm start` to start running the fast development mode Webpack build process that bundles files into the `dist` folder
3. `npm i --save-dev <package_name>` to install new packages

## Loading The Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Toggle on `Developer mode` in the top right corner
3. Click `Load unpacked`
4. Select the entire `dist` folder

## Project Structure

The project follows a modular structure:

```
src/
├── background/         # Chrome extension background scripts
├── contentScript/      # Content scripts injected into web pages
│   ├── components/    # Reusable React components
│   ├── scrapers/     # Site-specific scraping logic
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Shared utility functions
├── popup/             # Extension popup UI
└── static/            # Static assets and manifest
```

### Key Components

- **Scrapers**: Site-specific logic for extracting product information

  - `amazonScraper.ts`: Amazon product page scraping
  - `shopifyScraper.ts`: Shopify store product scraping
  - Add new scrapers here for additional e-commerce platforms

- **Utils**: Shared functionality across the extension
  - `messageHandlers.ts`: Chrome message passing utilities
  - `sanitization.ts`: Data cleaning and validation
  - `scraping.ts`: Common scraping utilities
  - `ui.tsx`: Shared UI components and helpers

### Scraping behavior (original logic restored)

- Amazon

  - Images: from `#leftCol img`, using `AC_US500` size normalization
  - Title: from `span[id*=title]` (prefers product title span, falls back to largest)
  - Descriptions: from bullets/overview/facts in `#centerCol`
  - Technical details: table rows in `#productDetails_feature_div` (key = th, value = td)
  - Technical description: spans in `#productDescription_feature_div`
  - Price: price/offscreen spans inside `#centerCol`

- Shopify
  - Product container detection: `main > .shopify-section` or likely large sections (fallback)
  - Images: filters reasonable product images, resolves lazy-loaded sources via `lazyLoadedImageScraper` and normalizes with `setShopifyImageLink`
  - Title: first from image `alt`, then from `[class*="title"]`
  - Descriptions: long text blocks from `span, p`
  - Price: `[data-product-price]` preferred; fallback `[class*=price]` with whitespace normalization
  - Variants: parsed from embedded JSON where available (`shopifyVariantScraper`)

Notes

- `sanitizeProductCache` accepts both string URLs and image objects and normalizes to string URLs.
- `productCache.images` is a string[] at the API boundary.

### Adding New Features

1. **New Scraper**:

   - Create a new file in `src/contentScript/scrapers/`
   - Implement the scraper interface from `types/index.ts`
   - Export scraping functions for use in `contentScript.tsx`

2. **New Component**:

   - Add React components to `src/contentScript/components/`
   - Import and use shared utilities from `utils/`

3. **New Utility Function**:
   - Add to appropriate utility file in `src/contentScript/utils/`
   - Export for use across the extension

## Production Build

1. `npm run build` to generate a minimized production build in the `dist` folder
2. ZIP the entire `dist` folder (e.g. `dist.zip`)
3. Publish the ZIP file on the Chrome Web Store Developer Dashboard

## Development Notes

- Webpack configuration flattens folders in the build
- Use relative imports for local ts/tsx/css files
- Static file references in HTML should be flat (e.g. `icon.png` not `../static/icon.png`)
- Update manifest permissions as needed (paths should be flat)

## Manifest v3 and bundling

- Content script and background are built as single, self-contained bundles (no code-splitting) for MV3 compatibility.
- `web_accessible_resources` includes `*.js`, `*.css`, and `icon.png` so assets are accessible at runtime.
- `host_permissions` and `content_scripts.matches` are set to `<all_urls>` for cross-site scraping.
- Content script runs at `document_idle` and injects `contentScript.css`.

## Debugging and troubleshooting

- Console logs are preserved in production builds for the content script.
- After clicking SCAN, you’ll see:
  - `RAW productCache BEFORE sanitization:` — direct scraper output
  - `SANITIZED productCache AFTER sanitization:` — payload sent to the background/API
- Background messaging
  - The background script guards against cases with no active tab. If a user switches tabs or closes the tab before a scan completes, the message will be skipped with a warning instead of throwing an error.

## Quick test checklist

1. Load `dist` as an unpacked extension in `chrome://extensions`.
2. Visit an Amazon product page and click SCAN.
   - Expect images (AC_US500), title, price, descriptions, tech details/description.
3. Visit a Shopify product page and click SCAN.
   - Expect images resolved from lazy loads, title, price, and (where present) variants.
4. Check DevTools console for the RAW and SANITIZED productCache debug logs.
