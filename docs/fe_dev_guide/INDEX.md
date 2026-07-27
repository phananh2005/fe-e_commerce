# Frontend Development Guide

Lịch sử cập nhật API và hướng dẫn cho Frontend.

| Version | Ngày tạo | Thay đổi | Breaking Change |
|---------|----------|----------|-----------------|
| V1.0.0 | N/A | [Frontend Development Guide — E-commerce DDD](V1_0_0__initial_fe_development_guide.md) | N/A |
| V1.0.1 | 2026-07-19 | [Bổ sung bộ lọc danh sách đơn hàng quản trị](V1_0_1__add_management_order_filters.md) | Không |
| V1.0.2 | 2026-07-19 | [Bổ sung lọc khoảng thời gian tạo đơn hàng](V1_0_2__add_order_creation_date_range_filter.md) | Không |
| V1.0.3 | 2026-07-19 | [Đơn giản hóa bộ lọc, thêm status filter, và thêm danh sách sản phẩm vào GET /management/order/search](V1_0_3__simplify_management_order_search_and_add_product_items.md) | Có |
| V1.0.4 | 2026-07-20 | [Thêm trường `status` và `modifiedAt` vào response của GET /management/order/search](V1_0_4__add_status_to_management_order_response.md) | Không |
| V1.0.5 | 2026-07-20 | [Thêm xác thực quyền dựa trên role cho GET /management/users/info/{id}](V1_0_5__add_role_based_access_control_to_get_user_info.md) | Không |
| V1.0.6 | N/A | [Thêm email và createdAt vào UserSummaryForManagementResponse](V1_0_6__add_email_and_createdAt_to_user_summary_for_management.md) | N/A |
| V1.0.7 | N/A | [Cập nhật getAllUsers: Bỏ modifiedDate filter, thêm userIdentifier filter, cập nhật keyword filter](V1_0_7__update_getAllUsers_filter_by_userId_and_keyword.md) | N/A |
| V1.0.8 | N/A | [Thêm xác thực ownership cho getOrderDetail](V1_0_8__add_order_ownership_validation_to_getOrderDetail.md) | N/A |
| V1.0.9 | N/A | [Thêm API getOrderDetailForManagement cho quản trị viên](V1_0_9__add_getOrderDetailForManagement_without_ownership_check.md) | N/A |
| V1.1.0 | N/A | [Refactor OrderDetailResponse: tách AddressInfo inner class](V1_1_0__refactor_orderDetailResponse_add_addressInfo_inner_class.md) | N/A |
| V1.1.1 | N/A | [Add userId Filter to Management Order Search](V1_1_1__add_userId_filter_to_management_order_search.md) | N/A |
| V1.1.2 | N/A | [V1_1_2 - Đổi tên trường `keyword` thành `name` trong API tìm kiếm](V1_1_2__rename_keyword_to_name_in_brand_category_search.md) | N/A |
| V1.1.3 | N/A | [V1_1_3 - Bắt buộc truyền parameter `folder` trong API lấy chữ ký upload Cloudinary](V1_1_3__make_folder_parameter_required_in_cloudinary_upload_signature.md) | N/A |
| V1.1.4 | N/A | [V1_1_4 - Thêm `cancellationReason` vào OrderDetailResponse](V1_1_4__add_cancellationReason_to_orderDetailResponse.md) | N/A |
| V1.1.5 | N/A | [FE Development Guide Migration - V1_1_5](V1_1_5__update_management_product_search_request_response_and_filters.md) | N/A |
| V1.1.6 | N/A | [V1.1.6: Migrate Public IDs to UUID](V1_1_6__migrate_public_ids_to_uuid.md) | N/A |
| V1.1.7 | N/A | [V1.1.7: Add Back `id` Fields for API Calls](V1_1_7__add_back_ids_for_api_calls.md) | N/A |
| V1.1.8 | N/A | [V1_1_8: Thay đổi bộ lọc API Management Order Search](V1_1_8__replace_orderCode_userId_with_orderUuid_userUuid_in_management_order_search.md) | N/A |
| V1.1.9 | N/A | [V1_1_9: Cập nhật getAllUsers - Đổi keyword→userInfo và thêm field id](V1_1_9__update_getAllUsers_request_response_add_id_userInfo.md) | N/A |
| V1.2.0 | N/A | [V1_2_0: Cập nhật API getAllProductsBySearch (Tìm kiếm bằng uuid, bổ sung id)](V1_2_0__update_getAllProductsBySearch_filter_uuid_and_add_id_response.md) | N/A |
| V1.2.1 | N/A | [Cập nhật Response Fields cho API Chi Tiết (Product, Order, User)](V1_2_1__add_audit_fields_and_linked_data_to_detail_apis.md) | N/A |
| V1.2.2 | N/A | [Thêm userId cho danh sách và username cho chi tiết đơn hàng quản trị](V1_2_2__add_userid_username_to_management_orders.md) | N/A |
| V1.3.0 | N/A | [Bỏ userUuid khỏi response getAllOrdersForManagement](V1_3_0__remove_useruuid_from_getallordersformanagement.md) | N/A |
| V1.3.1 | N/A | [Sửa lỗi sort parameter trong API danh sách user](V1_3_1__fix_user_list_sort_parameter_mapping.md) | N/A |
| V1.3.2 | N/A | [V1_3_2 - Thêm bộ lọc enabled cho tìm kiếm brand và category](V1_3_2__add_enabled_filter_to_brand_category_search.md) | N/A |
| V1.3.3 | N/A | [V1_3_3: Cập nhật response `GET /management/product/search` bổ sung audit fields](V1_3_3__update_management_product_search_audit_fields.md) | N/A |
| V1.3.4 | N/A | [V1_3_4: Thêm query parameter `status` cho API tìm kiếm sản phẩm quản trị](V1_3_4__add_management_product_search_status_filter.md) | N/A |
| V1.3.5 | N/A | [V1_3_5: Thêm API lấy summary biến thể sản phẩm](V1_3_5__add_product_variants_summary_api.md) | N/A |
| V1.3.6 | N/A | [V1_3_6: Thay thế API cập nhật stock biến thể bằng API cập nhật stock và price](V1_3_6__replace_updateVariantStock_with_updateVariantStockAndPrice.md) | N/A |
| V1.3.7 | N/A | [V1_3_7: Thêm brandId và categoryId vào response getManagementProductById](V1_3_7__add_brandId_categoryId_to_getManagementProductById.md) | N/A |
| V1.3.8 | N/A | [V1_3_8__fix_variant_image_deletion_logic](V1_3_8__fix_variant_image_deletion_logic.md) | N/A |
| V1.3.9 | N/A | [V1_1_0: Merge Variant Creation into Update Product API](V1_3_9__merge_variant_creation_into_update_product.md) | N/A |
| V1.4.0 | N/A | [V1_4_0 - Thêm productStatus vào API tạo sản phẩm](V1_4_0__add_product_status_to_create_api.md) | N/A |
| V1.4.1 | N/A | [Frontend Development Guide - Migration V1_4_1](V1_4_1__remove_sku_code_unique_constraint.md) | N/A |
| V1.4.2 | N/A | [Version 1.4.2 - Add deletedVariantIds to Update Product API](V1_4_2__add_deletedVariantIds_to_updateProduct.md) | N/A |
| V1.4.3 | N/A | [Version 1.4.3 - Rename Product Update Request Fields](V1_4_3__rename_product_update_request_fields.md) | N/A |
| V1.4.4 | N/A | [V1_4_4: Thêm validation khi xóa product variant](V1_4_4__add_variant_deletion_validation.md) | N/A |
| V1.4.5 | N/A | [V1_4_5: Thêm status (ACTIVE/INACTIVE) cho product variant](V1_4_5__add_status_to_product_variants.md) | N/A |
| V1.4.6 | N/A | [V1_4_6: Xóa tính năng xóa variant khỏi API update product](V1_4_6__remove_delete_variant_from_update_product.md) | N/A |
| V1.5.1 | N/A | [V1_5_1: Remove skuCode from updateProduct API (variant updates are read‑only)](V1_5_1__remove_skuCode_from_updateProduct.md) | N/A |
| V1.5.2 | N/A | [V1_5_2 – Dashboard Statistics APIs](V1_5_2__dashboard_statistics_apis.md) | Không |
| V1.6.0 | N/A | [V1.6.0: Thêm xác thực số điện thoại bằng Firebase Phone Auth](V1_6_0__add_firebase_phone_auth_and_verify.md) | N/A |
| V1.7.0 | N/A | [V1.7.0: Tách riêng API xác thực SMS OTP khỏi API đăng ký tài khoản](V1_7_0__separate_verify_sms_from_register_api.md) | N/A |
| V1.8.0 | N/A | [Bỏ API xác thực số điện thoại](V1_8_0__remove_verifyPhone_api.md) | Có |
| V2.0.0 | 2026-07-27 | [Thay đổi luồng đăng ký tài khoản (Lưu Redis 15 phút)](V2_0_0__change_registration_flow_with_redis.md) | Có |
| V2.1.0 | 2026-07-27 | [Thêm API gửi lại OTP (Reset thời gian lưu Redis)](V2_1_0__add_resend_otp_api.md) | Không |
| V2.1.1 | 2026-07-27 | [Cập nhật thời hạn lưu đăng ký lên 30 phút](V2_1_1__update_registration_ttl_to_30m.md) | Không |
