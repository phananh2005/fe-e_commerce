const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
content = content.replace(
  'import { ArrowLeft, Boxes, ChevronDown, ChevronRight, ImageIcon, Loader2, PackageSearch, Plus, Power, RefreshCw, Save, Trash2, X } from "lucide-react";',
  'import { ArrowLeft, Boxes, ChevronDown, ChevronRight, ImageIcon, Loader2, PackageSearch, Plus, Power, RefreshCw, Save, Trash2, X } from "lucide-react";\nimport { uploadImageToCloudinary } from "../../lib/uploadApi";'
);

// 2. DraftVariant
content = content.replace(
  '  variantAvatarUrl: string;',
  '  variantAvatarUrl: string;\n  avatarFile?: File | null;'
);

// 3. Product state
content = content.replace(
  '  const [avatarUrl, setAvatarUrl] = useState("");',
  '  const [avatarUrl, setAvatarUrl] = useState("");\n  const [avatarFile, setAvatarFile] = useState<File | null>(null);'
);

// 4. saveVariant
content = content.replace(
  '      const attributes: Record<string, string> = {};',
  `      let finalAvatarUrl = v.variantAvatarUrl;
      if (v.avatarFile) {
        const uploadedUrl = await uploadImageToCloudinary(v.avatarFile, token, "variant");
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }
      const attributes: Record<string, string> = {};`
);
content = content.replace(
  '        variantAvatarUrl: v.variantAvatarUrl || undefined,',
  '        variantAvatarUrl: finalAvatarUrl || undefined,'
);

// 5. handleSubmit
content = content.replace(
  '      if (isEdit) {',
  `      let finalProductAvatarUrl = avatarUrl;
      if (avatarFile) {
        const uploaded = await uploadImageToCloudinary(avatarFile, token, "product");
        if (uploaded) finalProductAvatarUrl = uploaded;
      }
      if (isEdit) {`
);
content = content.replace(
  '          productAvatarUrl: avatarUrl || null,',
  '          productAvatarUrl: finalProductAvatarUrl || null,'
);
content = content.replace(
  '          productAvatarUrl: avatarUrl || undefined,',
  '          productAvatarUrl: finalProductAvatarUrl || undefined,'
);

// Replace mapping variants in handleSubmit
content = content.replace(
  `        const variantPayload = variants
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
          });`,
  `        const variantPayload = await Promise.all(variants
          .filter((v) => v.skuCode.trim())
          .map(async (v) => {
            let finalVarAvatarUrl = v.variantAvatarUrl;
            if (v.avatarFile) {
              const uploadedUrl = await uploadImageToCloudinary(v.avatarFile, token, "variant");
              if (uploadedUrl) finalVarAvatarUrl = uploadedUrl;
            }
            const attributes: Record<string, string> = {};
            if (v.attrKey.trim() && v.attrValue.trim()) attributes[v.attrKey.trim()] = v.attrValue.trim();
            return {
              skuCode: v.skuCode,
              price: v.price,
              stockQuantity: v.stockQuantity,
              attributes: Object.keys(attributes).length ? attributes : undefined,
              variantAvatarUrl: finalVarAvatarUrl || undefined,
            };
          }));`
);

// 6. UI for Product Avatar
content = content.replace(
  `                <div className="flex-1">
                  <FieldLabel>URL ảnh đại diện sản phẩm</FieldLabel>
                  <input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className={inputCls}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">Nhập URL ảnh để xem preview bên trái.</p>
                </div>`,
  `                <div className="flex-1">
                  <FieldLabel>Ảnh đại diện sản phẩm</FieldLabel>
                  <div className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setAvatarFile(e.target.files[0]);
                          setAvatarUrl(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"
                    />
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-slate-500">Hoặc URL:</span>
                      <input
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarFile(null);
                        }}
                        className={inputCls}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                </div>`
);

// 7. UI for Variant Avatar
content = content.replace(
  `          <div className="col-span-1">
            <FieldLabel>URL ảnh biến thể</FieldLabel>
            <input
              value={v.variantAvatarUrl}
              onChange={(e) => onChange({ variantAvatarUrl: e.target.value })}
              className={inputCls}
              placeholder="https://..."
              disabled={v.saved && isEdit}
            />
          </div>`,
  `          <div className="col-span-1">
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
            )}
          </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Done");
