const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/admin/ProductFormPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add uploadImageToCloudinary to imports
content = content.replace(
  'import { ArrowLeft, Boxes, ChevronDown, ChevronRight, ImageIcon, Loader2, PackageSearch, Plus, Power, RefreshCw, Save, Trash2, X } from "lucide-react";',
  'import { ArrowLeft, Boxes, ChevronDown, ChevronRight, ImageIcon, Loader2, PackageSearch, Plus, Power, RefreshCw, Save, Trash2, X } from "lucide-react";\nimport { uploadImageToCloudinary } from "../../lib/uploadApi";'
);

// 2. Fix getProductVariants(token, p.uuid) to getProductVariants(token, p.id)
content = content.replace(
  'const vList = await getProductVariants(token, p.uuid);',
  'const vList = await getProductVariants(token, p.id);'
);

// 3. Fix addProductVariant(token, productUuid, { to use productDbId
content = content.replace(
  'await addProductVariant(token, productUuid, {',
  'await addProductVariant(token, productDbId, {'
);

// 4. Fix getProductVariants(token, productUuid) to use productDbId
content = content.replace(
  'const fresh = await getProductVariants(token, productUuid);',
  'const fresh = await getProductVariants(token, productDbId);'
);
content = content.replace(
  'const fresh = await getProductVariants(token, productUuid);',
  'const fresh = await getProductVariants(token, productDbId);'
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Done fixes');
