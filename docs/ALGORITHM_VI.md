# Thuật Toán Điều Khiển Nhiệt Độ Thông Minh (AI Logic)

---

## 1. Nguyên Lý Hoạt Động

Hệ thống không sử dụng các mô hình AI phức tạp (như Deep Learning) mà sử dụng phương pháp **Hệ Chuyên Gia (Rule-based)** kết hợp với **Học Thói Quen Người Dùng (Simple Reinforcement Learning)**.

Công thức cơ bản:

> **Nhiệt độ mục tiêu = Nhiệt độ chuẩn (26°C) + Điều chỉnh theo môi trường + Thói quen người dùng**

---

## 2. Các Yếu Tố Ảnh Hưởng

Hệ thống xem xét 5 yếu tố chính để đưa ra quyết định:

### A. Độ Ẩm (Humidity)

Độ ẩm ảnh hưởng lớn đến cảm giác nóng/lạnh của con người (Heat Index).

- **Độ ẩm cao (> 70%):** Cảm giác oi bức hơn thực tế ➔ **Giảm 1°C**.
- **Độ ẩm rất cao (> 80%):** Chuyển sang chế độ **Dry (Hút ẩm)**.
- **Độ ẩm thấp (< 40%):** Không khí khô, cảm giác lạnh hơn ➔ **Tăng 1°C**.

### B. Diện Tích Phòng (Room Area)

Diện tích ảnh hưởng đến tốc độ quạt gió để đảm bảo lưu thông khí.

- **Phòng lớn (> 30m²):** Tăng tốc độ quạt lên **High**.
- **Phòng nhỏ (< 15m²):** Giảm tốc độ quạt xuống **Low**.
- **Bình thường:** Để quạt chế độ **Auto**.

### C. Thời Tiết Bên Ngoài (Weather)

Tránh sốc nhiệt và tốn điện khi chênh lệch nhiệt độ quá lớn.

- Nếu trời rất nóng (> 35°C): Hệ thống sẽ **không cho phép nhiệt độ xuống dưới 25°C** để tránh máy nén hoạt động quá tải.

### D. Loại Máy Lạnh (AC Type)

- **Non-Inverter:** Loại máy này tiêu tốn nhiều điện khi khởi động lại. Hệ thống sẽ giữ nhiệt độ tối thiểu **25°C** để hạn chế việc đóng/ngắt máy nén liên tục.

### E. Thói Quen Người Dùng (User Preference) - "AI Learning"

Đây là phần thông minh nhất của thuật toán.

- Hệ thống ghi nhớ mỗi khi bạn chỉnh lại nhiệt độ (Ví dụ: AI set 26°C, bạn chỉnh xuống 24°C).
- Nó phân tích dữ liệu trong **7 ngày gần nhất** vào cùng khung giờ (±3 tiếng).
- Nếu bạn thường xuyên giảm nhiệt độ, hệ thống sẽ tự động trừ đi mức chênh lệch đó trong các lần sau.

---

## 3. Ví Dụ Minh Họa

### Ví dụ 1: Trời nồm ẩm (Mùa xuân)

- **Tình huống:** Phòng 20m², Độ ẩm 75%, Người dùng chưa có thói quen đặc biệt.
- **Tính toán:**
  - Nhiệt độ chuẩn: 26°C
  - Độ ẩm > 70%: -1°C
- **Kết quả:** Máy lạnh set **25°C**, Quạt **Auto**.

### Ví dụ 2: Người dùng thích lạnh (Mùa hè)

- **Tình huống:** Phòng 12m², Độ ẩm 50%. Người dùng thường xuyên chỉnh xuống 23°C vào buổi tối.
- **Tính toán:**
  - Nhiệt độ chuẩn: 26°C
  - Phòng nhỏ (< 15m²): Quạt Low
  - Học thói quen: Người dùng thường giảm 3°C (26 -> 23) ➔ Offset = -3°C
- **Kết quả:** Máy lạnh set **23°C**, Quạt **Low**.

### Ví dụ 3: Tiết kiệm điện ngày nắng nóng

- **Tình huống:** Trời nóng 38°C. Máy lạnh loại cũ (Non-Inverter).
- **Tính toán:**
  - Nhiệt độ chuẩn: 26°C
  - Trời nóng (> 35°C) & Máy Non-Inverter: Giới hạn Min = 25°C.
- **Kết quả:** Dù người dùng muốn lạnh hơn, hệ thống khuyến nghị set **25°C** để bảo vệ máy và tiết kiệm điện.

---

Powered by EoH
