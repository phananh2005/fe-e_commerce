const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Interface
content = content.replace(
  '  variantAvatarUrl: string;\n  avatarFile?: File | null;',
  '  variantAvatarUrl: string;\n  imageFiles?: File[];\n  avatarIndex?: number;'
);

// 2. makeDraftVariant
content = content.replace(
  '    variantAvatarUrl: "",\n    expanded: true,',
  '    variantAvatarUrl: "",\n    imageFiles: [],\n    avatarIndex: 0,\n    expanded: true,'
);

// 3. apiVariantToDraft
content = content.replace(
  '    variantAvatarUrl: v.variantImageUrl?.find((i) => i.isAvatar)?.imageUrl ?? "",',
  '    variantAvatarUrl: v.variantImageUrl?.find((i) => i.isAvatar)?.imageUrl ?? "",\n    imageFiles: [],\n    avatarIndex: 0,'
);

// 4. saveVariant
content = content.replace(
  `      let finalAvatarUrl = v.variantAvatarUrl;
      if (v.avatarFile) {
        const uploadedUrl = await uploadImageToCloudinary(v.avatarFile, token, "variant");
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }`,
  `      let finalAvatarUrl = v.variantAvatarUrl;
      let finalImageUrls: string[] = [];
      if (v.imageFiles && v.imageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          v.imageFiles.map(file => uploadImageToCloudinary(file, token, "variant"))
        );
        finalImageUrls = uploadedUrls.filter(Boolean) as string[];
        if (finalImageUrls.length > 0) {
          finalAvatarUrl = finalImageUrls[v.avatarIndex || 0] || finalImageUrls[0];
        }
      }`
);

// addProductVariant API call
content = content.replace(
  '        attributes: Object.keys(attributes).length ? attributes : undefined,\n        variantAvatarUrl: finalAvatarUrl || undefined,',
  '        attributes: Object.keys(attributes).length ? attributes : undefined,\n        variantAvatarUrl: finalAvatarUrl || undefined,\n        variantImageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,'
);

// 5. handleSubmit map
content = content.replace(
  `            let finalVarAvatarUrl = v.variantAvatarUrl;
            if (v.avatarFile) {
              const uploadedUrl = await uploadImageToCloudinary(v.avatarFile, token, "variant");
              if (uploadedUrl) finalVarAvatarUrl = uploadedUrl;
            }`,
  `            let finalVarAvatarUrl = v.variantAvatarUrl;
            let finalVarImageUrls: string[] = [];
            if (v.imageFiles && v.imageFiles.length > 0) {
              const uploadedUrls = await Promise.all(
                v.imageFiles.map(file => uploadImageToCloudinary(file, token, "variant"))
              );
              finalVarImageUrls = uploadedUrls.filter(Boolean) as string[];
              if (finalVarImageUrls.length > 0) {
                finalVarAvatarUrl = finalVarImageUrls[v.avatarIndex || 0] || finalVarImageUrls[0];
              }
            }`
);

content = content.replace(
  '              attributes: Object.keys(attributes).length ? attributes : undefined,\n              variantAvatarUrl: finalVarAvatarUrl || undefined,',
  '              attributes: Object.keys(attributes).length ? attributes : undefined,\n              variantAvatarUrl: finalVarAvatarUrl || undefined,\n              variantImageUrls: finalVarImageUrls.length > 0 ? finalVarImageUrls : undefined,'
);

// 6. Variant Avatar UI
const uiOld = `          <div>
            <FieldLabel>Ảnh đại diện biến thể</FieldLabel>
            {v.avatarFile || v.variantAvatarUrl ? (
              <div className="relative inline-block mt-1">
                <img
                  src={v.avatarFile ? URL.createObjectURL(v.avatarFile) : v.variantAvatarUrl}
                  className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                  alt=""
                />
                {(!v.saved || !isEdit) && (
                  <button
                    type="button"
                    onClick={() => onChange({ avatarFile: null, variantAvatarUrl: "" })}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-slate-200 shadow-sm text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onChange({ avatarFile: e.target.files[0] });
                    }
                  }}
                  disabled={v.saved && isEdit}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
                />

              </div>
            )}
          </div>`;

const uiNew = `          <div>
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
          </div>`;

content = content.replace(uiOld, uiNew);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
