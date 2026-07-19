---
trigger: always_on
---

# Quy tắc Thiết Kế Tối Thượng cho fe-e_commerce

**Mục tiêu**: Tận dụng tối đa bộ não thiết kế `ui-ux-pro-max` để hoàn thiện dự án Frontend E-commerce này với tiêu chuẩn chuyên nghiệp, cao cấp.

## Workflow Bắt Buộc Để Xây Dựng Giao Diện:

1. **Khởi tạo Design System (Source of Truth)**
   - Agent phải chạy lệnh sau để lấy chuẩn thiết kế riêng cho dự án E-commerce:
     `python C:\Users\PhanAnh\.gemini\config\skills\ui-ux-pro-max\scripts\search.py "e-commerce shopping modern clean" --design-system --persist -p "fe-e_commerce"`
   - Sau khi chạy, BẮT BUỘC đọc file `design-system/MASTER.md` để nắm các token (màu, font, spacing).

2. **Khi Phát Triển Page / Component Mới**
   - **Tra cứu tư vấn UX**: Dùng script với cờ `--domain` để lấy hướng dẫn cụ thể cho component đó.
     Ví dụ: `python C:\Users\PhanAnh\.gemini\config\skills\ui-ux-pro-max\scripts\search.py "product card" --domain ux` hoặc `python .../search.py "checkout cart" --domain react`.
   - **Thực thi Code**: Code bằng `ui-styling` (shadcn/ui + Tailwind).
     - Component: Dùng `npx shadcn@latest add <tên-component>`.
     - Styling: Phải tuân thủ Design Tokens từ `MASTER.md`. Cấm tuyệt đối tự bịa mã màu Hex hoặc font chữ.

3. **Checklist Bàn Giao (Pre-Delivery Check)**
   - **Visual**: Bắt buộc dùng Phosphor Icons hoặc Heroicons (Vector SVG). TUYỆT ĐỐI CẤM dùng Emoji làm icon.
   - **Interaction**: Mọi tương tác (nhấn, hover) phải có visual feedback (150-300ms). Trạng thái disabled phải rõ ràng.
   - **A11y & Theme**: Tương phản chữ chính >= 4.5:1, chữ phụ >= 3:1 ở cả Light và Dark Mode.
   - **Layout & Spacing**: Áp dụng chặt chẽ nhịp lưới 4/8dp (vd: p-4 = 16px, gap-2 = 8px). Đảm bảo Responsive.

4. **Xử Lý Data & Tích Hợp API**
   - BẮT BUỘC đọc thư mục `docs/fe_dev-guide` nếu cần biết thông tin cấu trúc API và response của backend.

5. **Kiểm Tra & Cập Nhật Hướng Dẫn Phát Triển (fe_dev_guide)**
   - Khi có lệnh kiểm tra `fe_dev_guide` hoặc áp dụng `fe_dev_guide` vào dự án:
     - Tiến hành đọc thư mục `docs/fe_dev_guide`.
     - Kiểm tra file `applied_version.md` đánh dấu phiên bản hiện tại của dự án FE.
     - So sánh với các phiên bản trong thư mục `docs/fe_dev_guide`. Nếu chưa phải bản mới nhất, thực hiện cập nhật dự án theo nội dung của phiên bản `fe_dev_guide` mới nhất.

**LỜI THỀ**: Agent KHÔNG ĐƯỢC tự ý thiết kế theo cảm tính. Phải coi `ui-ux-pro-max` là "Giám đốc Nghệ thuật" (Art Director) chỉ đạo mọi quyết định UI/UX thông qua file `MASTER.md`.
