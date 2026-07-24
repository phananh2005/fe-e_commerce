const fs = require('fs');

const path = 'update-product-form.cjs';
let content = fs.readFileSync(path, 'utf8');

// Replace the buggy content.replace with a reliable indexOf based replacement
const buggyReplace = 'content = content.replace(\n  `                <div className="flex-1">\n                  <FieldLabel>URL ảnh đại diện sản phẩm</FieldLabel>\n                  <input\n                    value={avatarUrl}\n                    onChange={(e) => setAvatarUrl(e.target.value)}\n                    className={inputCls}\n                    placeholder="https://example.com/image.jpg"\n                  />\n                  <p className="mt-1.5 text-xs text-slate-400">Nhập URL ảnh để xem preview bên trái.</p>\n                </div>`,\n  `                <div className="flex-1">\n                  <FieldLabel>Ảnh đại diện sản phẩm</FieldLabel>\n                  <div className="flex flex-col gap-2">\n                    <input\n                      type="file"\n                      accept="image/*"\n                      onChange={(e) => {\n                        if (e.target.files?.[0]) {\n                          setAvatarFile(e.target.files[0]);\n                          setAvatarUrl(URL.createObjectURL(e.target.files[0]));\n                        }\n                      }}\n                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-primary)]/10 file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)]/20"\n                    />\n                    <div className="flex gap-2 items-center">\n                      <span className="text-sm text-slate-500">Hoặc URL:</span>\n                      <input\n                        value={avatarUrl}\n                        onChange={(e) => {\n                          setAvatarUrl(e.target.value);\n                          setAvatarFile(null);\n                        }}\n                        className={inputCls}\n                        placeholder="https://example.com/image.jpg"\n                      />\n                    </div>\n                  </div>\n                </div>`\n);';

const newReplace = `
const startIdx = content.indexOf('<FieldLabel>URL');
if (startIdx !== -1) {
    // Find the enclosing <div className="flex-1">
    const divStart = content.lastIndexOf('<div className="flex-1">', startIdx);
    const pEnd = content.indexOf('</div>', startIdx);
    if (divStart !== -1 && pEnd !== -1) {
        content = content.substring(0, divStart) + \`<div className="flex-1">
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
                </div>\` + content.substring(pEnd + 6);
    }
}
`;

content = content.replace(buggyReplace, newReplace);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed script');
