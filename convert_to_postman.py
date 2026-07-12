import json
from pathlib import Path

src = Path("docs/api-docs.json")
dst = Path("docs/api-postman-collection.json")

spec = json.loads(src.read_text(encoding="utf-8"))
base_url = spec["servers"][0]["url"].rstrip("/")

# Realistic Vietnamese sample data per schema name (mapped by $ref leaf name)
SAMPLE_BODIES = {
    "ProductUpdateRequest": {
        "productId": 1,
        "name": "Laptop Dell XPS 15",
        "description": "Laptop cao cấp dành cho lập trình viên",
        "categoryId": 2,
        "brandId": 3,
        "productAvatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
        "variants": [
            {
                "variantId": 10,
                "skuCode": "XPS-15-I7-16GB",
                "price": 25990000,
                "stockQuantity": 50,
                "variantAvatarUrl": "https://res.cloudinary.com/.../variant1.jpg",
                "attributes": {"Màu sắc": "Bạc", "RAM": "16GB"},
                "variantImageIdsToDelete": [],
                "variantImagesUrlsToAdd": []
            }
        ]
    },
    "CategoryUpdateRequest": {
        "categoryId": 1,
        "categoryName": "Laptop",
        "categoryDescription": "Các dòng laptop, ultrabook, gaming",
        "imageUrl": "https://res.cloudinary.com/.../category.jpg"
    },
    "CategoryCreateRequest": {
        "categoryName": "Phụ kiện",
        "categoryDescription": "Chuột, bàn phím, tai nghe",
        "imageUrl": "https://res.cloudinary.com/.../phu-kien.jpg"
    },
    "CheckoutRequest": {
        "fullName": "Nguyễn Văn A",
        "phoneNumber": "0987654321",
        "paymentMethod": "COD",
        "shippingAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "items": [{"variantId": 10, "quantity": 2}, {"variantId": 15, "quantity": 1}]
    },
    "CreateUserRequest": {
        "username": "nguyenvana",
        "password": "password123",
        "email": "nguyenvana@example.com",
        "address": "456 Lê Lợi, Quận 3, TP.HCM",
        "fullName": "Nguyễn Văn A",
        "phoneNumber": "0987654321",
        "roleName": "ROLE_CUSTOMER"
    },
    "DashboardRevenueReportRequest": {
        "fromDate": "2026-01-01",
        "toDate": "2026-07-12",
        "groupBy": "MONTH"
    },
    "DashboardOrderStatisticRequest": {
        "fromDate": "2026-01-01",
        "toDate": "2026-07-12"
    },
    "ProductVariantCreateRequest": {
        "skuCode": "LAP-DELL-I7-16GB",
        "price": 21990000,
        "stockQuantity": 100,
        "variantAvatarUrl": "https://res.cloudinary.com/.../variant.jpg",
        "variantImageUrls": [
            "https://res.cloudinary.com/.../img1.jpg",
            "https://res.cloudinary.com/.../img2.jpg"
        ],
        "attributes": {"Màu sắc": "Đen", "RAM": "16GB", "Ổ cứng": "512GB SSD"}
    },
    "ProductCreateRequest": {
        "name": "MacBook Pro 14 M3",
        "description": "Laptop Apple M3 Pro, 18GB RAM, 512GB SSD",
        "categoryId": 2,
        "brandId": 1,
        "productAvatarUrl": "https://res.cloudinary.com/.../mbp14.jpg",
        "variants": [
            {
                "skuCode": "MBP14-M3-18-512",
                "price": 45990000,
                "stockQuantity": 30,
                "attributes": {"Màu sắc": "Bạc", "RAM": "18GB", "Ổ cứng": "512GB"},
                "variantAvatarUrl": "https://res.cloudinary.com/.../mbp-silver.jpg",
                "variantImageUrls": []
            }
        ]
    },
    "BrandCreateRequest": {
        "name": "Apple",
        "description": "Thương hiệu công nghệ cao cấp",
        "imageUrl": "https://res.cloudinary.com/.../apple-logo.jpg"
    },
    "BrandUpdateRequest": {
        "brandId": 1,
        "name": "Apple",
        "description": "Thương hiệu công nghệ cao cấp - updated",
        "imageUrl": "https://res.cloudinary.com/.../apple-logo-new.jpg"
    },
    "CartAddItemRequest": {
        "variantId": 10,
        "quantity": 1
    },
    "CartUpdateItemRequest": {
        "cartItemId": 5,
        "quantity": 3,
        "variantId": 10
    },
    "RegisterRequest": {
        "username": "nguyenvanb",
        "password": "password123",
        "email": "nguyenvanb@example.com",
        "address": "789 Trần Hưng Đạo, Quận 5, TP.HCM",
        "fullName": "Nguyễn Văn B",
        "phoneNumber": "0912345678"
    },
    "RefreshTokenRequest": {
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "LogoutRequest": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "AuthenticationRequest": {
        "username": "nguyenvana",
        "password": "password123"
    },
    "IntrospectRequest": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "UserInfoUpdateRequest": {
        "fullName": "Nguyễn Văn A Cập Nhật",
        "phoneNumber": "0987654321",
        "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
        "email": "nguyenvana@example.com"
    },
    "UserChangePasswordRequest": {
        "oldPassword": "password123",
        "newPassword": "newpassword456"
    },
    "UserRoleUpdateRequest": {
        "userId": 1,
        "roleNames": ["ROLE_ADMIN"]
    },
    "OrderPreviewRequest": {
        "variantId": 10,
        "quantity": 2
    }
}

def schema_name_from_ref(ref):
    return ref.split("/")[-1]

def build_sample_body(op):
    content = op.get("requestBody", {}).get("content", {})
    for mt in ("application/json", "application/*+json", "*/*"):
        if mt in content:
            schema = content[mt].get("schema", {})
            if "$ref" in schema:
                name = schema_name_from_ref(schema["$ref"])
                if name in SAMPLE_BODIES:
                    return SAMPLE_BODIES[name]
            # Handle array type with items.$ref
            if schema.get("type") == "array" and "items" in schema:
                items_ref = schema["items"].get("$ref", "")
                name = schema_name_from_ref(items_ref)
                if name in SAMPLE_BODIES:
                    return [SAMPLE_BODIES[name]]
    return None

def build_query_params(op):
    params = []
    for p in op.get("parameters", []):
        if p.get("in") != "query":
            continue
        schema = p.get("schema", {})
        val = ""
        if "$ref" in schema:
            name = schema_name_from_ref(schema["$ref"])
            if name == "ManagementUserQueryRequest":
                val = "keyword=&page=0&size=10&sortBy=createdAt&sortType=desc"
            elif name == "CustomerProductSearchRequest":
                val = "keyword=&page=0&size=12&sortBy=sold&sortType=desc"
            elif name == "StaffProductSearchRequest":
                val = "keyword=&page=0&size=10&sortBy=createdAt&sortType=desc"
            elif name == "CategorySearchRequest":
                val = "keyword=&page=0&size=10&sortBy=createdAt&sortType=desc"
            elif name == "BrandSearchRequest":
                val = "keyword=&page=0&size=10&sortBy=createdAt&sortType=desc"
        if "type" in schema or "enum" in schema:
            t = schema.get("type")
            if t == "string":
                val = "string"
            elif t == "integer":
                val = "0"
            elif t == "boolean":
                val = "true"
        params.append({"key": p["name"], "value": val})
    return params

ROLE_GROUPS = {
    "Xác thực": "public",
    "Sản phẩm (customer)": "public",
    "Danh mục": "public",
    "Thương hiệu": "public",
    "Cloudinary": "public",
    "Người dùng": "customer",
    "Mục giỏ hàng": "customer",
    "Đơn hàng": "customer",
    "Sản phẩm": "admin",
    "Quản trị - Người dùng": "admin",
    "Quản trị - Đơn hàng": "admin",
    "Quản trị - Danh mục": "admin",
    "Quản trị - Thương hiệu": "admin",
    "Thống kê": "admin",
}

items_by_role = {}
for path, methods in spec.get("paths", {}).items():
    for method, op in methods.items():
        tag = op.get("tags", ["API"])[0]
        role = ROLE_GROUPS.get(tag, "Khác")
        req = {
            "method": method.upper(),
            "header": [],
            "url": {
                "raw": base_url + path,
                "host": [base_url.split("://")[-1]],
                "path": [seg for seg in path.strip("/").split("/") if seg],
            },
        }

        # Build query params from parameters
        qp = build_query_params(op)
        if qp:
            req["url"]["query"] = qp

        # Path variables
        if "{" in path:
            req["url"]["variable"] = [
                {"key": seg.strip("{").strip("}"), "value": "1"}
                for seg in path.split("/") if "{" in seg
            ]

        # Request body
        body = build_sample_body(op)
        if body is not None and method.lower() in {"post", "put", "patch", "delete"}:
            req["body"] = {
                "mode": "raw",
                "raw": json.dumps(body, ensure_ascii=False, indent=2),
                "options": {"raw": {"language": "json"}}
            }
            req["header"].append({"key": "Content-Type", "value": "application/json"})

        # Auth
        req["auth"] = {
            "type": "bearer",
            "bearer": [{"key": "token", "value": "{{accessToken}}", "type": "string"}]
        }

        item = {
            "name": f"[{tag}] {op.get('summary', op.get('operationId', f'{method.upper()} {path}'))}",
            "request": req
        }
        items_by_role.setdefault(role, []).append(item)

collection = {
    "info": {
        "name": spec["info"]["title"],
        "_postman_id": "b0f3c7ef-2b2f-4c9f-9f2f-1a8d6d2d2a01",
        "description": spec["info"].get("description", ""),
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [{"name": role, "item": items} for role, items in items_by_role.items()],
    "variable": [{"key": "baseUrl", "value": base_url}]
}

dst.write_text(json.dumps(collection, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Successfully created {dst}")