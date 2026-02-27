# Hướng Dẫn: Giải Quyết CORS và Chiến Lược Triển Khai API

Tài liệu này giải thích lý do tại sao chúng ta sử dụng đường dẫn tương đối `/api` thay vì đường dẫn tuyệt đối trong mã nguồn, và hướng dẫn cách triển khai (deploy) các ứng dụng web giao tiếp với API một cách chuẩn chỉ.

## 1. Tại sao dùng `ERA_API_BASE_URL = "/api"` thay vì `https://backend.eoh.io`?

Bạn gặp lỗi **CORS (Cross-Origin Resource Sharing)** khi cố gắng gọi trực tiếp từ Frontend (`http://localhost:5173`) sang Backend (`https://backend.eoh.io`).

### Vấn đề: CORS Policy (Chính sách chia sẻ tài nguyên chéo nguồn)

Trình duyệt web có một cơ chế bảo mật gọi là **Same-Origin Policy**. Nó ngăn chặn trang web ở domain này (ví dụ: `localhost`) gửi request ngầm (như fetch/axios) sang domain khác (ví dụ: `backend.eoh.io`) trừ khi domain đích cho phép rõ ràng.

Khi bạn set:

```javascript
// SAI trong môi trường dev nếu backend không mở CORS cho localhost
ERA_API_BASE_URL = "https://backend.eoh.io";
```

Request đi: `localhost` -> `backend.eoh.io`.
Trình duyệt chặn lại và báo lỗi: _Access to fetch has been blocked by CORS policy_.

### Giải pháp: Sử dụng Proxy (Cầu nối)

Khi bạn set:

```javascript
// ĐÚNG: Sử dụng đường dẫn tương đối
ERA_API_BASE_URL = "/api";
```

Và cấu hình `vite.config.js`:

```javascript
server: {
  proxy: {
    "/api": {
      target: "https://backend.eoh.io",
      changeOrigin: true,
    },
  },
}
```

Luồng đi của dữ liệu sẽ như sau:

1. **Frontend (Browser):** Gọi đến `http://localhost:5173/api/...`
   - Trình duyệt thấy request đến cùng domain (`localhost`), nên **KHÔNG chặn CORS**.
2. **Vite Development Server:** Nhận request `/api`. Server này không phải trình duyệt, nên nó không bị giới hạn bởi CORS.
3. **Vite Server:** Chuyển tiếp (forward) request đó đến `https://backend.eoh.io`.
4. **Backend:** Trả về dữ liệu cho Vite Server.
5. **Vite Server:** Trả về dữ liệu cho Frontend.

**Tóm lại:** Chúng ta dùng `/api` để "đánh lừa" trình duyệt rằng chúng ta đang gọi nội bộ, trong khi thực tế Vite Server đang đứng giữa làm trung gian để gọi ra ngoài.

---

## 2. Hướng dẫn triển khai (Deploy) hệ thống Website gọi API

Khi đưa sản phẩm ra môi trường thực tế (Production), bạn sẽ không còn Vite Development Server nữa. Vậy làm sao để mô hình `/api` vẫn hoạt động hoặc làm sao để gọi API đúng cách? Có 3 chiến lược chính:

### Chiến lược 1: Reverse Proxy (Khuyên dùng - Chuẩn nhất)

Đây là cách mô phỏng lại những gì Vite Proxy làm, nhưng sử dụng Web Server mạnh mẽ như **Nginx**, **Apache**, hoặc **Cloudflare**.

**Mô hình:**

- Bạn có một domain duy nhất: `https://my-app.com`
- User truy cập vào đó để tải frontend React.
- Website gọi API tới: `https://my-app.com/api/users` (vẫn là relative path `/api`).

**Cấu hình Nginx (Ví dụ):**

```nginx
server {
    listen 80;
    server_name my-app.com;

    # 1. Phục vụ Frontend (Files tĩnh sau khi build)
    location / {
        root /var/www/my-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # 2. Proxy request /api sang Backend thực tế
    location /api {
        proxy_pass https://backend.eoh.io; # Backend thật nằm ở đây
        proxy_set_header Host backend.eoh.io;
        proxy_ssl_server_name on;
    }
}
```

**Ưu điểm:** Không bao giờ lo về CORS, bảo mật tốt (giấu được địa chỉ backend thực).

### Chiến lược 2: Cấu hình CORS ở phía Backend (Cross-Domain)

Nếu bạn deploy frontend ở `https://my-frontend.com` và backend ở `https://api.my-backend.com`.

**Yêu cầu:** Backend phải được lập trình để chấp nhận request từ domain của frontend.
Backend Developer phải thêm header vào response:

```http
Access-Control-Allow-Origin: https://my-frontend.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

**Nhược điểm:**

- Phải đụng vào code Backend.
- Nếu cấu hình sai (`*`) sẽ gây lỗ hổng bảo mật.
- Browser phải gửi thêm `Preflight Request` (OPTIONS) gây chậm nhẹ.

### Chiến lược 3: API Gateway

Sử dụng các dịch vụ đám mây (AWS API Gateway, Kong, Tyk) đứng trước Backend. Frontend gọi vào Gateway, Gateway gọi vào Backend. Tương tự như Reverse Proxy nhưng ở quy mô lớn hơn với nhiều tính năng quản lý traffic.

## Tổng kết: Quy trình chuẩn cho Developer

1. **Trong code:** Luôn sử dụng biến môi trường (`VITE_API_URL`) hoặc relative path `/api`. Không hardcode domain.
2. **Khi Dev (Local):** Dùng `vite.config.js` (hoặc `setupProxy.js` trong CRA) để proxy `/api` sang server thật.
3. **Khi Deploy:**
   - **Tốt nhất:** Cấu hình **Nginx/Web Server** làm Reverse Proxy (giống Chiến lược 1).
   - **Nếu server rời nhau:** Yêu cầu Backend mở **CORS** cho domain của Frontend (Chiến lược 2).
