# Frontend Development Guide - Migration V1_4_1

## General Information

- **Version**: V1_4_1
- **Ngày tạo**: 2026-07-25
- **Mục đích**: Cập nhật API quản lý sản phẩm sau khi bỏ ràng buộc UNIQUE cho field `sku_code` trong database

## Thay đổi Database

| Bảng | Trường | Thay đổi |
|------|--------|----------|
| product_variants | sku_code | Bỏ ràng buộc UNIQUE |

## Flyway Migration

- **File**: `V8__remove_sku_code_unique_constraint.sql`
- **Lệnh SQL**:
  ```sql
  ALTER TABLE product_variants DROP INDEX UK_product_variants_sku_code;
  ALTER TABLE product_variants MODIFY sku_code VARCHAR(255) NOT NULL;
  ```

## Breaking Change

**Không**

## Ảnh hưởng Frontend

Không có thay đổi nào trên frontend. Trường `sku_code` vẫn tồn tại và có thể được dùng như trước.

Tuy nhiên, backend giờ cho phép tồn tại nhiều variant cùng `sku_code` (trước đó phải unique). Frontend không cần thay đổi logic xử lý.

## Hướng dẫn cập nhật

Không cần thay đổi code frontend.

## Notes

- Entity `ProductVariant` đã được cập nhật: `@Column(name = "sku_code", nullable = false)` (bỏ `unique = true`)
- Backend sẽ không kiểm tra uniqueness của `sku_code` nữa khi validate
