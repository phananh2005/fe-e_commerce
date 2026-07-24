# V1_1_0: Merge Variant Creation into Update Product API

**Date:** 2026-07-25  
**Version:** 1.1.0  
**Breaking Change:** No

## Overview

The standalone API endpoint for creating product variants has been consolidated into the `updateProduct` endpoint. Frontend can now create new variants directly while updating product information in a single request.

## API Changes

### Deprecated Endpoint
- **Method:** POST
- **Path:** `/management/product/{productId}/variants`
- **Status:** REMOVED
- **Replacement:** Use PUT `/management/product/update` with `newVariants` field

### Updated Endpoint
- **Method:** PUT
- **Path:** `/management/product/update`
- **Status:** ENHANCED

#### Request Body Changes

**New Field Added:** `newVariants`

```json
{
  "productId": 1,
  "name": "Product Name",
  "description": "Description",
  "categoryId": 1,
  "brandId": 1,
  "productAvatarUrl": "https://...",
  "variants": [
    {
      "variantId": 1,
      "skuCode": "SKU-001",
      "price": 100.00,
      "stockQuantity": 50,
      "variantAvatarUrl": "https://..."
    }
  ],
  "newVariants": [
    {
      "skuCode": "SKU-002",
      "price": 120.00,
      "stockQuantity": 30,
      "variantAvatarUrl": "https://...",
      "variantImageUrls": ["https://...", "https://..."],
      "attributes": {
        "color": "blue",
        "size": "L"
      }
    }
  ]
}
```

**Key Differences:**
- `variants[]` - Array for updating EXISTING variants (requires `variantId`)
- `newVariants[]` - Array for creating NEW variants (no `variantId`)

## Frontend Implementation Guide

### Before (Two Separate Requests)

```javascript
// Step 1: Update product
const updateProductResponse = await fetch('/management/product/update', {
  method: 'PUT',
  body: JSON.stringify({
    productId: 1,
    name: 'Updated Name',
    variants: [
      { variantId: 1, skuCode: 'SKU-001', price: 100, stockQuantity: 50 }
    ]
  })
});

// Step 2: Create new variant (separate call)
const createVariantResponse = await fetch('/management/product/1/variants', {
  method: 'POST',
  body: JSON.stringify({
    skuCode: 'SKU-002',
    price: 120,
    stockQuantity: 30,
    variantAvatarUrl: 'https://...',
    variantImageUrls: ['https://...']
  })
});
```

### After (Single Request)

```javascript
// Single request handles both updates and new variants
const updateResponse = await fetch('/management/product/update', {
  method: 'PUT',
  body: JSON.stringify({
    productId: 1,
    name: 'Updated Name',
    variants: [
      { variantId: 1, skuCode: 'SKU-001', price: 100, stockQuantity: 50 }
    ],
    newVariants: [
      {
        skuCode: 'SKU-002',
        price: 120,
        stockQuantity: 30,
        variantAvatarUrl: 'https://...',
        variantImageUrls: ['https://...']
      }
    ]
  })
});
```

## Validation Rules

### `variants[]` (Existing Variant Updates)
- `variantId` - Required (Long, must exist)
- `skuCode` - Required (String, not blank)
- `price` - Required (Decimal, >= 0)
- `stockQuantity` - Required (Integer, >= 0)
- `variantAvatarUrl` - Optional (String, null = keep existing, "" = remove, non-empty = update)
- `attributes` - Optional (Map<String, String>)

### `newVariants[]` (New Variant Creation)
- `skuCode` - Required (String, not blank)
- `price` - Required (Decimal, >= 0)
- `stockQuantity` - Required (Integer, >= 0)
- `variantAvatarUrl` - Optional (String, Cloudinary URL)
- `variantImageUrls` - Optional (Array of Cloudinary URLs)
- `attributes` - Optional (Map<String, String>)

## Error Handling

**HTTP 400 (Bad Request):**
- Missing required fields in variants or newVariants
- Invalid price/stockQuantity values
- Duplicate SKU codes within same request

**HTTP 404 (Not Found):**
- Product not found
- Variant not found (when updating with wrong variantId)

**HTTP 409 (Conflict):**
- Concurrent update detected (optimistic locking)

## Affected Frontend Features

- Product management dashboard - update product modal/form
- Product variant management - can now create variants inline in product update
- Product variant list - no longer need separate variant creation flow

## Migration Steps

1. **Update API calls**
   - Replace separate product update + variant create calls with single updateProduct call

2. **Merge forms** (optional, but recommended)
   - Combine product info form with variant creation form in single form

3. **Update validation**
   - Ensure newVariants array matches validation rules

4. **Test scenarios:**
   - Update product + create 1 new variant
   - Update product + create multiple new variants
   - Update existing variants + create new variants simultaneously
   - Update product without creating variants (backward compatible)

## Backward Compatibility

- Existing updateProduct requests WITHOUT `newVariants` field continue to work
- Old variant update logic unchanged
- No impact on other APIs

## Questions

Contact backend team if clarification needed on API contract.
