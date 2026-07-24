# V1_3_8__fix_variant_image_deletion_logic

**Version:** V1.3.8  
**Date:** 2026-07-25  
**Type:** Bug Fix

## Changes

### API Affected
- `PUT /management/product/update` - Update Product with Variants

### Problem
Variant image deletion logic was reversed. Images were only deleted when the `variantImageIdsToDelete` array was **empty** instead of when it **contained IDs**.

### Fix Applied
Corrected the condition from:
```java
if (ListUtils.isNullOrEmpty(variantRequest.getVariantImageIdsToDelete())) {
    // delete logic
}
```

To:
```java
if (!ListUtils.isNullOrEmpty(variantRequest.getVariantImageIdsToDelete())) {
    // delete logic
}
```

## Frontend Impact

### Request
No changes to `variantImageIdsToDelete` field behavior. It continues to accept an array of image IDs to delete.

### Expected Behavior (Now Fixed)
- When providing `variantImageIdsToDelete: [id1, id2, ...]`, those images **will now be deleted** (was broken before)
- When providing `variantImageIdsToDelete: []` or omitting the field, images **will not be deleted** (correct behavior)
- Images will be removed from Cloudinary storage when deleted

## Validation Notes
Ensure `variantImageUrls` and `attributes` in `newVariants[]` are properly validated before sending:
- `variantImageUrls`: Array of strings (URLs or file paths), must be non-empty for new variants
- `attributes`: Array of variant attributes with name and value

## Breaking Changes
No breaking changes. This is a bug fix that enables the intended deletion behavior.

## Migration Steps for Frontend
1. Test variant image deletion with non-empty `variantImageIdsToDelete` arrays
2. Verify images are removed from the UI and Cloudinary after update
3. No code changes required; behavior now works as expected
