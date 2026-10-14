# CSAT Roadmap

Lộ trình HSG Tin học và Chuyên Tin THCS của CSAT Tutor, gồm 43 chủ đề thuộc ba lớp:

- **A:** Nền tảng C++ — A01–A09.
- **B:** HSG Phường / Xã — B01–B15.
- **C:** HSG Tỉnh, Chuyên Tin — C01–C12 và D01–D07.

Xem sơ đồ hoặc danh sách, lọc theo lớp, tìm kiếm không dấu và mở danh sách bài tập tương ứng trên CSATOJ. Mỗi chủ đề có nền cần học trước, các nhánh có thể học tiếp và nội dung thu gọn. Trang dùng bàn phím được: Tab để chọn, Enter để mở, Escape để đóng.

**Trang web:** https://iusedtohavealife.github.io/csat-roadmap/

## Chạy và chỉnh sửa

Cần Node.js 20 trở lên. Trang phát hành trong `public/` là HTML/CSS/JavaScript và SVG tĩnh; không cần backend, framework hay thư viện tải từ bên ngoài.

```sh
npm ci
npm run build
npm run check
npm run dev
```

Preview tại `http://127.0.0.1:8785/`. Sửa nội dung, nền cần có và liên kết bài tập trong `src/roadmap.json`; sửa giao diện trong `src/index.html`, `src/styles.css` và `src/app.js`. Chạy lại `build` và `check`, rồi commit cả thư mục `public/`.

SVG được dựng bằng Graphviz khi build. Trình duyệt chỉ tải sơ đồ đang xem và lưu các sơ đồ đã mở trong phiên; tìm kiếm giữ nguyên mức phóng to và vị trí cuộn. Tên tài nguyên chứa mã băm để tránh dùng nhầm bản cũ khi cập nhật. Đường dẫn tương đối hỗ trợ GitHub Pages dưới `/csat-roadmap/`.

## Kiểm tra

```sh
npx playwright install chromium
npm test
```

Kiểm tra trình duyệt bao gồm tải sơ đồ theo nhu cầu, tìm kiếm, phóng to, 43 liên kết tag, D01–D07, nút quay lại/tiến tới, bàn phím, màn hình 375px và tải lại khi lỗi. Ảnh và báo cáo được ghi vào `test-results/` và không đưa lên GitHub. Có thể đặt `CHROME_PATH` để dùng Chrome đã cài hoặc `BASE_URL` để kiểm tra một preview đang chạy.

ID tag lấy từ bản xuất CSATOJ hoàn chỉnh ngày 10/10/2026. Các bài tập trên CSATOJ được quản lý riêng; roadmap chỉ dẫn đến danh sách lọc theo tag.

## Xuất bản

Workflow `.github/workflows/pages.yml` phát hành nội dung `public/` qua GitHub Pages mỗi lần đẩy lên nhánh `main`. Trong **Settings → Pages**, nguồn xuất bản là **GitHub Actions**.
