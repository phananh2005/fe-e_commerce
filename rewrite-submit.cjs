const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldSubmit = `    try {
      let finalProductAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadImageToCloudinary(avatarFile, token, "product");
        if (uploaded) finalProductAvatarUrl = uploaded;
      }
      if (isEdit) {
        // Upload variant images first
        const variantPayload = await Promise.all(variants.map(async (v) => {
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
            variantId: v.variantId || undefined,
            skuCode: v.skuCode,
            price: v.price,
            stockQuantity: v.stockQuantity,
            attributes: Object.keys(attributes).length ? attributes : undefined,
            variantAvatarUrl: finalVarAvatarUrl || undefined,
            variantImageIdsToDelete: v.deletedImageIds?.length ? v.deletedImageIds : undefined,
            variantImagesUrlsToAdd: finalVarImageUrls.length > 0 ? finalVarImageUrls : undefined,
          };
        }));

        await updateProduct(token, {
          productId: productDbId,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || undefined,
          variants: variantPayload.length ? variantPayload : undefined,
        });
        toast.show("Cập nhật sản phẩm thành công", "success");
        // Reload
        const p = await getProductDetail(token, productDbId);
        setModifiedAt(p.modifiedAt);
        setModifiedBy(p.modifiedBy);
      } else {
        const variantPayload = variants
          .filter((v) => v.skuCode.trim())
          .map((v) => {
            const attributes: Record<string, string> = {};
            if (v.attrKey.trim() && v.attrValue.trim()) attributes[v.attrKey.trim()] = v.attrValue.trim();
            return {
              skuCode: v.skuCode,
              price: v.price,
              stockQuantity: v.stockQuantity,
              attributes: Object.keys(attributes).length ? attributes : undefined,
              variantAvatarUrl: v.variantAvatarUrl || undefined,
            };
          });

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
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setSaving(false);
    }`;

const newSubmit = `    try {
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
    } catch (e) {
      toast.show(translateError(e), "error");
    } finally {
      setSaving(false);
    }`;

// Check if oldSubmit is found, else try another regex to replace it
if (content.includes(oldSubmit)) {
    content = content.replace(oldSubmit, newSubmit);
} else {
    // We can do a string index replacement because maybe it got slightly modified
    const startIdx = content.indexOf('    try {\n      let finalProductAvatarUrl');
    const endIdx = content.indexOf('    } finally {\n      setSaving(false);\n    }');
    if (startIdx !== -1 && endIdx !== -1) {
        content = content.substring(0, startIdx) + newSubmit + content.substring(endIdx + '    } finally {\n      setSaving(false);\n    }'.length);
    } else {
        console.error("Could not find the submit block to replace");
        process.exit(1);
    }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done rewriting handleSubmit');
