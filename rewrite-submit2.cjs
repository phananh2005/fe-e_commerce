const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the handleSubmit try block
const startMatch = "    try {";
const endMatch = "    } catch (e) {";

// But we specifically want the try block inside handleSubmit
const handleSubmitDef = "  const handleSubmit = async (e: React.FormEvent) => {";
const handleSubmitIndex = content.indexOf(handleSubmitDef);

if (handleSubmitIndex === -1) {
    console.error("handleSubmit not found");
    process.exit(1);
}

const tryIndex = content.indexOf(startMatch, handleSubmitIndex);
const catchIndex = content.indexOf(endMatch, tryIndex);

if (tryIndex === -1 || catchIndex === -1) {
    console.error("try or catch block not found inside handleSubmit");
    process.exit(1);
}

const newTryBlock = `    try {
      let finalProductAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadImageToCloudinary(avatarFile, token, "product");
        if (uploaded) finalProductAvatarUrl = uploaded;
      }

      // 1. Upload ảnh cho tất cả variants
      const processedVariants = await Promise.all(variants
        .filter((v) => v.skuCode.trim())
        .map(async (v) => {
          let finalVarAvatarUrl = v.variantAvatarUrl;
          let finalVarImageUrls: string[] = [];
          
          if (v.imageFiles && v.imageFiles.length > 0) {
            const uploadedUrls = await Promise.all(
              v.imageFiles.map(file => uploadImageToCloudinary(file, token, "variant"))
            );
            finalVarImageUrls = uploadedUrls.filter(Boolean) as string[];
            if (v.avatarIndex !== undefined && v.avatarIndex >= 0 && finalVarImageUrls.length > 0) {
              finalVarAvatarUrl = finalVarImageUrls[v.avatarIndex] || finalVarImageUrls[0];
            }
          }
          
          const attributes: Record<string, string> = {};
          if (v.attrKey.trim() && v.attrValue.trim()) attributes[v.attrKey.trim()] = v.attrValue.trim();
          
          return {
            ...v,
            finalVarAvatarUrl,
            finalVarImageUrls,
            attributes: Object.keys(attributes).length ? attributes : undefined,
          };
        })
      );

      if (isEdit) {
        // Tách riêng variants cũ (có variantId) và variants mới
        const existingVariants = processedVariants.filter(v => v.variantId).map(v => ({
          variantId: v.variantId,
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantImageIdsToDelete: v.deletedImageIds?.length ? v.deletedImageIds : undefined,
          variantImagesUrlsToAdd: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        const newVariants = processedVariants.filter(v => !v.variantId).map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        // 2. Cập nhật Product và Existing Variants
        await updateProduct(token, {
          productId: productDbId,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || null,
          variants: existingVariants.length ? existingVariants : undefined,
        });

        // 3. Tạo New Variants
        for (const nv of newVariants) {
          await addProductVariant(token, productDbId, nv);
        }

        toast.show("Cập nhật sản phẩm thành công", "success");
        // Reload
        const p = await getProductDetail(token, productDbId);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);
        
        const vList = await getProductVariants(token, productDbId);
        setVariants((vList ?? []).map(apiVariantToDraft));
      } else {
        const variantPayload = processedVariants.map(v => ({
          skuCode: v.skuCode,
          price: v.price,
          stockQuantity: v.stockQuantity,
          attributes: v.attributes,
          variantAvatarUrl: v.finalVarAvatarUrl || undefined,
          variantImageUrls: v.finalVarImageUrls.length > 0 ? v.finalVarImageUrls : undefined,
        }));

        await createProduct(token, {
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || undefined,
          variants: variantPayload.length ? variantPayload : undefined,
        });
        toast.show("Tạo sản phẩm thành công", "success");
        navigate("/admin/products");
      }
`;

content = content.substring(0, tryIndex) + newTryBlock + content.substring(catchIndex);

// Also add the import for uploadImageToCloudinary
if (!content.includes('uploadImageToCloudinary')) {
    content = content.replace(
        'import { useNavigate, useParams } from "react-router-dom";',
        'import { useNavigate, useParams } from "react-router-dom";\nimport { uploadImageToCloudinary } from "../../lib/uploadApi";'
    );
}

// Ensure addProductVariant is imported
if (!content.includes('addProductVariant')) {
    content = content.replace(
        '  updateProduct,',
        '  updateProduct,\n  addProductVariant,'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done rewriting handleSubmit robustly');
