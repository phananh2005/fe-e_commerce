const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove editPrice and editStock states
const statesToRemove = `  const [editStock, setEditStock] = useState(false);
  const [stockVal, setStockVal] = useState(v.stockQuantity);
  const [editPrice, setEditPrice] = useState(false);
  const [priceVal, setPriceVal] = useState(v.price);`;
content = content.replace(statesToRemove, '');

// 2. Remove price edit UI
const priceUI = `              {v.saved && isEdit ? (
                <div>
                  {editPrice ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={priceVal}
                        onChange={(e) => setPriceVal(Number(e.target.value))}
                        className={\`\${inputCls} flex-1\`}
                      />
                      <button
                        type="button"
                        onClick={() => { onUpdateVariant({ price: priceVal }); setEditPrice(false); }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditPrice(false)}
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setPriceVal(v.price); setEditPrice(true); }}
                      className={\`\${inputCls} text-left cursor-pointer hover:border-[var(--color-primary)] bg-white\`}
                    >
                      {formatCurrency(v.price)} <span className="text-slate-400 text-xs">· click để sửa</span>
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={v.price}
                  onChange={(e) => onChange({ price: Number(e.target.value) })}
                  className={inputCls}
                />
              )}`;

const priceUINew = `              <input
                type="number"
                min={0}
                value={v.price}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                className={inputCls}
              />`;
content = content.replace(priceUI, priceUINew);

// 3. Remove stock edit UI
const stockUI = `              {v.saved && isEdit ? (
                <div>
                  {editStock ? (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        value={stockVal}
                        onChange={(e) => setStockVal(Number(e.target.value))}
                        className={\`\${inputCls} flex-1\`}
                      />
                      <button
                        type="button"
                        onClick={() => { onUpdateVariant({ stockQuantity: stockVal }); setEditStock(false); }}
                        className="btn-primary px-3 py-2 text-xs"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditStock(false)}
                        className="rounded-xl border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setStockVal(v.stockQuantity); setEditStock(true); }}
                      className={\`\${inputCls} text-left cursor-pointer hover:border-[var(--color-primary)] bg-white\`}
                    >
                      {v.stockQuantity} <span className="text-slate-400 text-xs">· click để sửa</span>
                    </button>
                  )}
                </div>
              ) : (
                <input
                  type="number"
                  min={0}
                  value={v.stockQuantity}
                  onChange={(e) => onChange({ stockQuantity: Number(e.target.value) })}
                  className={inputCls}
                />
              )}`;

const stockUINew = `              <input
                type="number"
                min={0}
                value={v.stockQuantity}
                onChange={(e) => onChange({ stockQuantity: Number(e.target.value) })}
                className={inputCls}
              />`;
content = content.replace(stockUI, stockUINew);


// 4. Remove onUpdateVariant from props
content = content.replace(
  '  onUpdateVariant: (data: { stockQuantity?: number; price?: number }) => void;\n',
  ''
);
content = content.replace(
  '  onSave,\n  onUpdateVariant,\n}: {',
  '  onSave,\n}: {'
);

// 5. Remove handleVariantUpdate from main component
const handleVarUpdOld = `  // ── Update variant of saved variant
  const handleVariantUpdate = useCallback(async (index: number, data: { stockQuantity?: number; price?: number }) => {
    if (!token || !productDbId) return;
    const v = variants[index];
    if (!v.variantId) return;
    try {
      await updateVariantStockAndPrice(token, String(v.variantId), data);
      toast.show("Cập nhật biến thể thành công", "success");
      const fresh = await getProductVariants(token, productDbId);
      setVariants((fresh ?? []).map(apiVariantToDraft));
    } catch (e) {
      toast.show(translateError(e), "error");
    }
  }, [token, productDbId, variants, toast]);\n\n`;

content = content.replace(handleVarUpdOld, '');

// 6. Update ProductFormPage rendering VariantCard to not pass onUpdateVariant
const variantCardRenderOld = `                      onChange={(patch) => patchVariant(i, patch)}
                      onRemove={() => removeVariant(i)}
                      onSave={() => saveVariant(i)}
                      onUpdateVariant={(data) => handleVariantUpdate(i, data)}
                    />`;

const variantCardRenderNew = `                      onChange={(patch) => patchVariant(i, patch)}
                      onRemove={() => removeVariant(i)}
                      onSave={() => saveVariant(i)}
                    />`;
content = content.replace(variantCardRenderOld, variantCardRenderNew);

// 7. Remove disabled={v.saved && isEdit} from SKU, AttrKey, AttrValue
content = content.replace(/                disabled={v\.saved && isEdit}\n/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done variant text inputs V2');
