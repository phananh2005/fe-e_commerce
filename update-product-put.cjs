const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update DraftVariant interface
content = content.replace(
  '  avatarIndex?: number;',
  '  avatarIndex?: number;\n  deletedImageIds?: number[];'
);

content = content.replace(
  '  avatarIndex: 0,',
  '  avatarIndex: 0,\n  deletedImageIds: [],' // In makeDraftVariant
);
content = content.replace(
  '    avatarIndex: 0,\n    attributes: v.attributes,',
  '    avatarIndex: 0,\n    deletedImageIds: [],\n    attributes: v.attributes,' // In apiVariantToDraft
);

// 2. VariantCard UI: combine variantImageUrl and imageFiles handling
const uiOld = `          <div>
            <FieldLabel>Ảnh biến thể</FieldLabel>
            {v.saved && isEdit ? (
              /* Already saved in edit mode, wait, this should just show v.variantImageUrl, which is handled below */
              <div className="text-sm text-slate-400 mt-1 italic">Vui lòng xem phần ảnh ở dưới.</div>
            ) : (
              <div className="flex flex-col gap-3 mt-1">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files);
                      const currentFiles = v.imageFiles || [];
                      onChange({ imageFiles: [...currentFiles, ...newFiles] });
                    }
                  }}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
                />
                {v.imageFiles && v.imageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {v.imageFiles.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          className={\`h-16 w-16 rounded-lg object-cover border-2 transition cursor-pointer \${v.avatarIndex === i ? "border-[var(--color-primary)] shadow-md" : "border-slate-200 hover:border-slate-300"}\`}
                          alt=""
                          onClick={() => onChange({ avatarIndex: i })}
                        />
                        {v.avatarIndex === i && (
                          <span className="absolute -top-1 -left-1 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow">
                            AVT
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = [...v.imageFiles!];
                            newFiles.splice(i, 1);
                            let newIndex = v.avatarIndex || 0;
                            if (newIndex === i) newIndex = 0;
                            else if (newIndex > i) newIndex--;
                            onChange({ imageFiles: newFiles, avatarIndex: newIndex });
                          }}
                          className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Variant images (view only from API) */}
          {v.variantImageUrl && v.variantImageUrl.length > 0 && (
            <div>
              <FieldLabel>Ảnh biến thể</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {v.variantImageUrl.map((img) => (
                  <div key={img.imageId} className="relative group">
                    <img
                      src={img.imageUrl}
                      alt=""
                      className={\`h-16 w-16 rounded-lg object-cover border-2 transition \${
                        img.isAvatar ? "border-[var(--color-primary)]" : "border-slate-200"
                      }\`}
                    />
                    {img.isAvatar && (
                      <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full px-1 py-0.5">
                        AVT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}`;

const uiNew = `          <div>
            <FieldLabel>Ảnh biến thể</FieldLabel>
            <div className="flex flex-col gap-3 mt-1">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    const currentFiles = v.imageFiles || [];
                    onChange({ imageFiles: [...currentFiles, ...newFiles] });
                  }
                }}
                className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
              />
              <div className="flex flex-wrap gap-3">
                {/* Ảnh từ API (chưa bị xóa) */}
                {v.variantImageUrl && v.variantImageUrl.filter(img => !v.deletedImageIds?.includes(img.imageId)).map((img) => {
                  const isCurrentAvatar = v.variantAvatarUrl === img.imageUrl;
                  return (
                    <div key={img.imageId} className="relative group">
                      <img
                        src={img.imageUrl}
                        alt=""
                        className={\`h-16 w-16 rounded-lg object-cover border-2 transition cursor-pointer \${
                          isCurrentAvatar ? "border-[var(--color-primary)] shadow-md" : "border-slate-200 hover:border-slate-300"
                        }\`}
                        onClick={() => onChange({ variantAvatarUrl: img.imageUrl, avatarIndex: -1 })}
                      />
                      {isCurrentAvatar && (
                        <span className="absolute -top-1 -left-1 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow">
                          AVT
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const newDeleted = [...(v.deletedImageIds || []), img.imageId];
                          let newAvatarUrl = v.variantAvatarUrl;
                          let newAvatarIndex = v.avatarIndex;
                          // If we deleted the current avatar, fallback to first available image
                          if (isCurrentAvatar) {
                            const remainingApiImages = v.variantImageUrl!.filter(i => !newDeleted.includes(i.imageId));
                            if (remainingApiImages.length > 0) {
                              newAvatarUrl = remainingApiImages[0].imageUrl;
                            } else if (v.imageFiles && v.imageFiles.length > 0) {
                              newAvatarUrl = "";
                              newAvatarIndex = 0;
                            } else {
                              newAvatarUrl = "";
                            }
                          }
                          onChange({ deletedImageIds: newDeleted, variantAvatarUrl: newAvatarUrl, avatarIndex: newAvatarIndex });
                        }}
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Ảnh mới upload */}
                {v.imageFiles && v.imageFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      className={\`h-16 w-16 rounded-lg object-cover border-2 transition cursor-pointer \${v.avatarIndex === i ? "border-[var(--color-primary)] shadow-md" : "border-slate-200 hover:border-slate-300"}\`}
                      alt=""
                      onClick={() => onChange({ avatarIndex: i, variantAvatarUrl: "" })}
                    />
                    {v.avatarIndex === i && (
                      <span className="absolute -top-1 -left-1 bg-[var(--color-primary)] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 shadow">
                        AVT
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const newFiles = [...v.imageFiles!];
                        newFiles.splice(i, 1);
                        let newIndex = v.avatarIndex || 0;
                        if (newIndex === i) {
                          // Try to fallback to API image if exists
                          const remainingApiImages = v.variantImageUrl?.filter(img => !v.deletedImageIds?.includes(img.imageId)) || [];
                          if (remainingApiImages.length > 0) {
                            newIndex = -1;
                            onChange({ imageFiles: newFiles, avatarIndex: -1, variantAvatarUrl: remainingApiImages[0].imageUrl });
                            return;
                          }
                          newIndex = 0;
                        }
                        else if (newIndex > i) newIndex--;
                        onChange({ imageFiles: newFiles, avatarIndex: newIndex });
                      }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>`;

content = content.replace(uiOld, uiNew);

// 3. Update handleSubmit
const submitOld = `        await updateProduct(token, {
          productId: productDbId,
          name,
          description,
          categoryId: categoryId || undefined,
          brandId: brandId || undefined,
          productAvatarUrl: finalProductAvatarUrl || undefined,
        });
        toast.show("Cập nhật sản phẩm thành công", "success");`;

const submitNew = `        // Upload variant images first
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
        toast.show("Cập nhật sản phẩm thành công", "success");`;

content = content.replace(submitOld, submitNew);

// 4. Remove the individual "Save Variant" button when isEdit === true if it's already saved
// Wait, the user can just not see the button if it's saved.
const saveBtnOld = `{isEdit && (
            <button
              onClick={() => {
                if (v.saved) {
                  // Update existing
                  handleVariantUpdate(index, { stockQuantity: v.stockQuantity, price: v.price });
                } else {
                  // Save new
                  saveVariant(index);
                }
              }}
              disabled={v.saving}
              className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--color-primary)]/90 transition shadow-sm disabled:opacity-50"
            >
              {v.saving ? "Đang lưu..." : v.saved ? "Lưu biến thể" : "Lưu (Thêm mới)"}
            </button>
          )}`;

const saveBtnNew = `{isEdit && !v.saved && (
            <button
              onClick={() => saveVariant(index)}
              disabled={v.saving}
              className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--color-primary)]/90 transition shadow-sm disabled:opacity-50"
            >
              {v.saving ? "Đang lưu..." : "Lưu (Thêm mới)"}
            </button>
          )}`;

content = content.replace(saveBtnOld, saveBtnNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
