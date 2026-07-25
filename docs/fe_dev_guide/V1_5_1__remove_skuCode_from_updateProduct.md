# V1_5_1: Remove skuCode from updateProduct API (variant updates are read‑only)

**Version**: V1_5_1  
**Date**: 2026-07-25  
**Change type**: Breaking change  
**Breaking**: Yes

## What changed

The field `skuCode` has been removed from the request body of `PUT /management/product/{productId}` when updating existing variants.

- `skuCode` can only be set when a **new variant** is created (`newVariants` array).
- When updating an existing variant (`existVariants`), `skuCode` is no longer editable.
- The `skuCode` value is still returned in all responses (read‑only).

## Updated request schema

```json
{
  "productId": 123,
  "existVariants": [
    {
      "variantId": 456,
      "price": 99.99,
      "stockQuantity": 10,
      "status": "ACTIVE"
      // "skuCode" field is NOT present anymore
    }
  ],
  "newVariants": [
    {
      "skuCode": "NEW‑SKU‑001",   // skuCode is allowed only here
      "price": 49.99,
      "stockQuantity": 5
    }
  ]
}
```

## Front‑end impact

- Remove the **SKU code** input field from the variant edit form.
- Keep the display of the existing SKU code as read‑only.
- Only allow users to set `skuCode` when they add a **new** variant.

## Migration steps

1. Delete the `skuCode` input from the edit‑variant UI.
2. Display the current `skuCode` as plain text (not editable).
3. Ensure the update‑product payload for existing variants does **not** contain `skuCode`.
4. If you use a library that automatically serialises all non‑null fields, explicitly set `skuCode` to `null` for existing variants before sending the request.

## Why this change

- SKU codes should be immutable after creation to maintain data integrity.
- Aligns with the pattern that `status` is now used to deactivate variants instead of physical deletion.
- Simplifies the contract – fewer fields to manage for updates.

## Status

✅ Backend implementation completed.  
⏳ Front‑end update pending.
