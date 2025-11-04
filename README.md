# xRay Chrome Extension

A Chrome extension that helps users scan and analyze Amazon products to find matches with alternative suppliers.

Built with Manifest V3, TypeScript, React 18, Webpack 5, and PostCSS.

## Chrome Web Store Compliance

This extension has been optimized for Chrome Web Store submission with:

- **Minimal Permissions**: Uses `activeTab` instead of broad `tabs` permission
- **Amazon-Only Operation**: Content script restricted to Amazon domains for focused functionality
- **Secure Architecture**: Background service worker with proper message validation

## Current Functionality

**Amazon Integration Only:**

- Content script operates exclusively on Amazon product pages (`*.amazon.*`)
- Scans product details including images, titles, prices, and descriptions
- Communicates with xRay API (`tryxray.ai`) for product matching

**Future Shopify Support:**

- Shopify scraping modules exist in codebase but are disabled
- Will require expanded host permissions in future versions
- Currently, `productCache.type` is only set to 'Amazon', so Shopify logic never executes

# ----------------------------------------------------------------------------

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

- **Background Service Worker**:

  - `background.ts`: Message routing and handler orchestration
  - `api.ts`: Secure API communication with abort functionality
  - `handlers.ts`: Request processing and response management
  - `validators.ts`: Input validation and security checks

- **Content Script Architecture**:

  - `contentScript.tsx`: Main content script with brute force tab-switch protection
  - `components/Scanner/`: Interactive scanning UI with multiple states
  - `utils/ui.tsx`: DOM injection and UI rendering utilities
  - `utils/messageHandlers.ts`: Chrome message passing utilities
  - `utils/sanitization.ts`: Data cleaning and validation
  - `utils/scraping.ts`: Common scraping utilities

- **Scrapers**: Site-specific logic for extracting product information
  - `amazonScraper.ts`: Amazon product page scraping (active)
  - `shopifyScraper.ts`: Shopify store product scraping (dormant)
  - `shopifyVariantScraper.ts`: Shopify variant detection (dormant)

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

## Robust Tab-Switch Protection

The extension implements brute force protection against cross-tab contamination:

- **Visibility Detection**: Monitors `document.visibilityState` changes
- **Complete Blocking**: When user leaves page during scan, ALL functionality is disabled:
  - Message listener blocks all incoming messages
  - `injectFoundProduct()` blocks all product injection
  - `renderScanner()` blocks all new UI creation
- **Fetch Abortion**: Background API calls are aborted when tabs switch
- **Zero Configuration**: Uses native browser APIs for immediate response

## Manifest V3 and Chrome Web Store Compliance

- **Minimal Permissions**: Only `["storage", "contextMenus", "activeTab"]`
- **Restricted Host Access**: Content script limited to Amazon domains only
- **Service Worker Architecture**: Background runs as MV3 service worker
- **Secure Bundling**: Single, self-contained bundles for content script and background
- **Runtime Assets**: `web_accessible_resources` includes necessary assets
- **Proper Injection**: Content script runs at `document_idle` with CSS injection

## Debugging and troubleshooting

- Console logs are preserved in production builds for the content script.
- After clicking SCAN, you’ll see:
  - `RAW productCache BEFORE sanitization:` — direct scraper output
  - `SANITIZED productCache AFTER sanitization:` — payload sent to the background/API
- Background messaging
  - The background script guards against cases with no active tab. If a user switches tabs or closes the tab before a scan completes, the message will be skipped with a warning instead of throwing an error.

## UI States and User Experience

The Scanner component handles multiple states:

- **`notScanning`**: Shows "SCAN" button to initiate product analysis
- **`scanning`**: Displays "Please Do Not Leave Page!!!" with loading indicator
- **`match`**: Shows enlarged "MATCH!" button for found alternatives
- **`noMatch`**: Displays "This Product is X-proof" message
- **`timeOut`**: Shows error state with "Try Again" option

## Quick Test Checklist

1. **Setup**: Load `dist` as unpacked extension in `chrome://extensions`
2. **Amazon Test**: Visit any Amazon product page and click SCAN
   - Expected: Images (AC_US500), title, price, descriptions, technical details
   - Scanner UI should appear and show appropriate state
3. **Tab Switch Test**: Start a scan, then switch tabs immediately
   - Expected: All functionality blocked, no cross-tab contamination
4. **Debug Logs**: Check DevTools console for:
   - `RAW productCache BEFORE sanitization:` — direct scraper output
   - `SANITIZED productCache AFTER sanitization:` — API payload
   - Blocking messages when tab switching occurs

## Chrome Web Store Deployment

This extension is ready for Chrome Web Store submission:

- Complies with Manifest V3 requirements
- Uses minimal necessary permissions
- Implements proper security practices
- Includes robust error handling and user protection
