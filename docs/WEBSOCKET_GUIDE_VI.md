# Hướng dẫn Chuyên sâu: WebSocket & Giao thức Real-time

Tài liệu này giải thích chi tiết về WebSocket, so sánh với các giao thức khác, và hướng dẫn cách lập trình trên cả Web và thiết bị phần cứng (ESP32).

---

## 1. Khái niệm & Ví dụ Trừu tượng

### WebSocket là gì?

WebSocket là một **giao thức truyền thông** cho phép tạo ra một kết nối mở, hai chiều (full-duplex) giữa Client (trình duyệt/điện thoại) và Server. Một khi đã kết nối, cả hai bên có thể gửi dữ liệu cho nhau bất cứ lúc nào mà không cần "hỏi" trước.

### Ví dụ Dễ hiểu: "Thư tay" vs "Cuộc gọi điện thoại"

Để hiểu sự khác biệt giữa giao thức HTTP truyền thống và WebSocket, hãy tưởng tượng tình huống bạn muốn cập nhật tin tức từ một người bạn:

#### A. Giao thức HTTP (Truyền thống) - Giống như gửi Thư tay

1.  **Bạn (Client):** Gửi thư hỏi "Có gì mới không?".
2.  **Bưu điện (Internet):** Chuyển thư đi.
3.  **Người bạn (Server):** Nhận thư, viết trả lời "Không có gì", gửi lại.
4.  **Kết thúc:** Sau khi nhận thư trả lời, quy trình kết thúc. Nếu bạn muốn hỏi lại 1 giây sau, bạn phải _viết một lá thư mới_.
    - _Nhược điểm:_ Tốn công, độ trễ cao, lãng phí giấy mực (header data) cho mỗi lần hỏi.

#### B. Giao thức WebSocket - Giống như Cuộc gọi điện thoại

1.  **Bạn (Client):** Bấm số gọi đi (Handshake).
2.  **Người bạn (Server):** Nhấc máy "Alo".
3.  **Kết nối thiết lập:** Đường dây thông suốt.
    - Bạn có thể nói.
    - Người bạn có thể nói bất cứ lúc nào ("Ê có tin mới nè!").
    - Không cần bấm số lại.
4.  **Kết thúc:** Chỉ khi một trong hai bên cúp máy.
    - _Ưu điểm:_ Nhanh, thời gian thực, tiết kiệm thao tác kết nối.

---

## 2. Sự khác biệt với các giao thức khác

| Đặc điểm         | HTTP (REST API)                         | WebSocket                                   | MQTT (Thường chạy trên TCP/WS)         |
| :--------------- | :-------------------------------------- | :------------------------------------------ | :------------------------------------- |
| **Mô hình**      | Request - Response (Hỏi - Đáp)          | Full-duplex (Hai chiều)                     | Pub/Sub (Đăng ký/Phát bản tin)         |
| **Kết nối**      | Đóng ngay sau khi nhận phản hồi         | Giữ kết nối liên tục (Persistent)           | Giữ kết nối liên tục                   |
| **Bên chủ động** | Client luôn phải hỏi Server trước       | Server có thể chủ động đẩy tin xuống Client | Broker đẩy tin xuống Client đã đăng ký |
| **Phù hợp cho**  | Tải trang web, form data, lấy danh sách | Chat, Game, Chứng khoán, Thông báo          | IoT, Thiết bị di động, Mạng yếu        |

### Khi nào sử dụng WebSocket?

- **Có:** Ứng dụng Chat, Game Online, Bảng điều khiển chứng khoán/tiền ảo, Theo dõi vị trí xe (Uber/Grab), Dashboard IoT cập nhật liên tục (như dự án Điều hòa của bạn).
- **Không:** Chỉ để lấy danh sách sản phẩm, đăng nhập, gửi form liên hệ (HTTP tốt hơn và dễ cache hơn).

---

## 2.1 Sự khác biệt giữa ws:// và wss://, và cách truyền dữ liệu

#### a. Sự khác biệt giữa ws:// và wss://

- `ws://` (WebSocket): Kết nối WebSocket thông thường, không mã hóa, tương tự như HTTP. Dữ liệu truyền đi không được bảo vệ, dễ bị nghe lén hoặc giả mạo.
- `wss://` (WebSocket Secure): Kết nối WebSocket được mã hóa qua TLS/SSL, tương tự như HTTPS. Dữ liệu được bảo vệ khỏi nghe lén và giả mạo, rất quan trọng khi truyền thông tin nhạy cảm hoặc điều khiển thiết bị từ xa.

> **Khuyến nghị:** Luôn sử dụng `wss://` trong môi trường production để đảm bảo an toàn, đặc biệt khi kết nối từ trình duyệt hoặc thiết bị IoT.

#### b. Dữ liệu trong WebSocket được truyền như thế nào?

- Khi kết nối được thiết lập, client và server có thể gửi/nhận dữ liệu bất cứ lúc nào (full-duplex, real-time).
- Dữ liệu truyền qua WebSocket thường là chuỗi (string), JSON, hoặc nhị phân (binary). Trong ứng dụng MQTT, payload thường là chuỗi JSON hoặc text.
- Ví dụ:
  - Gửi: `client.send(JSON.stringify({ type: 'command', value: 1 }))`
  - Nhận: `socket.onmessage = (event) => { const data = JSON.parse(event.data); }`

#### c. Tại sao các AI Box/Robot/Assistant sử dụng WebSocket?

1. **Real-time:** WebSocket cho phép truyền dữ liệu hai chiều liên tục, rất phù hợp cho các hệ thống AI cần phản hồi tức thời (ví dụ: AI Box nhận lệnh từ server, gửi trạng thái, nhận kết quả AI, ...).
2. **Tiết kiệm tài nguyên:** Không cần liên tục gửi request như HTTP polling, giảm tải cho server và client.
3. **Đơn giản hóa giao tiếp:** Một kết nối duy nhất cho cả gửi và nhận, dễ quản lý trạng thái thiết bị.
4. **Hỗ trợ tốt cho IoT:** Các thiết bị nhỏ gọn, AI Box, robot... thường dùng WebSocket để duy trì kết nối ổn định, tiết kiệm pin và băng thông.

#### d. Minh họa luồng dữ liệu WebSocket

```
Client (AI Box, Dashboard, ...) <==== WebSocket (ws/wss) ====> Server (AI, MQTT Broker, ...)
```

Khi client gửi dữ liệu (ví dụ: trạng thái cảm biến, lệnh điều khiển), server nhận và xử lý ngay lập tức, có thể phản hồi lại client trong cùng kết nối đó.

---

---

## 3. Nguyên lý hoạt động & Cấu trúc

WebSocket hoạt động dựa trên cơ chế **Handshake (Bắt tay)** trên nền TCP.

1.  **Bước 1: Client gửi yêu cầu HTTP Upgrade.**
    - Ban đầu, nó vẫn là một request HTTP bình thường gửi đến Server nhưng đính kèm header: `Upgrade: websocket`.
    - "Chào Server, tôi muốn chuyển từ nhắn tin thư tay sang gọi điện thoại nhé?"
2.  **Bước 2: Server đồng ý (Switching Protocols).**
    - Server trả về mã 101 (Switching Protocols).
    - "Ok, chuyển sang chế độ điện thoại (WebSocket)."
3.  **Bước 3: Trao đổi dữ liệu (Data Frames).**
    - Kết nối HTTP bị hủy bỏ, thay vào đó là kết nối TCP socket giữ nguyên.
    - Dữ liệu được đóng gói thành các "Frame" nhỏ nhẹ để bay qua bay lại cực nhanh.

---

## 4. Cách Code: Web vs ESP32

Trong dự án IoT, có một điểm kỹ thuật quan trọng:

- **Web (Trình duyệt):** Bắt buộc phải dùng WebSocket (hoặc MQTT over WebSocket) vì trình duyệt không cho phép mở kết nối TCP thô (Raw TCP Socket) vì lý do bảo mật.
- **ESP32/Hardware:** Thường dùng **Raw TCP** (cổng 1883) để tối ưu hiệu năng, nhưng cũng _có thể_ dùng WebSocket (cổng 8083/8084) nếu cần đi qua tường lửa web.

### A. Web (JavaScript / React)

Trên web, chúng ta có sẵn API `WebSocket` của trình duyệt.

**Cú pháp thuần (Raw WebSocket):**

```javascript
// 1. Tạo kết nối
const ws = new WebSocket("wss://echo.websocket.org");

// 2. Lắng nghe sự kiện mở kết nối
ws.onopen = () => {
  console.log("Đã kết nối!");
  ws.send("Hello Server"); // Gửi tin
};

// 3. Lắng nghe tin nhắn từ Server
ws.onmessage = (event) => {
  console.log("Nhận tin:", event.data);
};
```

**Trong dự án của bạn (Dùng thư viện MQTT over WebSocket):**
Chúng ta không dùng `WebSocket` trần, mà dùng thư viện `mqtt.js`. Thư viện này bọc WebSocket bên trong để nó nói chuyện theo ngôn ngữ MQTT.

```javascript
import mqtt from "mqtt";

// Lưu ý giao thức là 'ws' hoặc 'wss'
const client = mqtt.connect("wss://mqtt1.eoh.io:8084/mqtt");

client.on("connect", () => {
  client.subscribe("topic/cua/ban");
});

client.on("message", (topic, message) => {
  // Xử lý dữ liệu
});
```

### B. ESP32 (C++ / Arduino)

Trên ESP32, cú pháp "cấp thấp" hơn và quản lý bộ nhớ chặt chẽ hơn.

**Cấu hình:**
Thường dùng thư viện `PubSubClient` (cho MQTT TCP) hoặc `WebSocketsClient` (cho raw WS).

**Ví dụ 1: ESP32 dùng MQTT chuẩn (TCP - Cổng 1883) - _Khuyên dùng cho thiết bị_**
Đây là cách phổ biến nhất vì nhẹ hơn WebSocket.

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient; // Tạo TCP Client thường
PubSubClient client(espClient);

void setup() {
  // Cấu hình server port 1883 (TCP)
  client.setServer("mqtt1.eoh.io", 1883);
}

void loop() {
  if (!client.connected()) {
    reconnect(); // Hàm tự viết để connect lại
  }
  client.loop(); // Giữ kết nối sống
}
```

**Ví dụ 2: ESP32 dùng WebSocket (Cổng 8083/8084)**
Nếu bạn bắt buộc ESP32 phải giả lập làm một trình duyệt.

```cpp
#include <WebSocketsClient.h>

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_TEXT:
            Serial.printf("Nhận tin: %s\n", payload);
            break;
    }
}

void setup() {
    // Kết nối đến server WS
    webSocket.begin("mqtt1.eoh.io", 8084, "/mqtt");
    webSocket.onEvent(webSocketEvent);
}

void loop() {
    webSocket.loop();
}
```

### Tóm tắt sự khác biệt Code

1.  **Cú pháp:**

    - **Web:** Hướng sự kiện (Event-driven) hoàn toàn (`.on('message')`). JavaScript tự quản lý luồng.
    - **ESP32:** Phải gọi hàm `.loop()` liên tục trong vòng lặp chính để duy trì kết nối và xử lý gói tin đến. Nếu code bị chặn (delay) quá lâu, kết nối sẽ rớt ("Timeout").

2.  **Giao thức nền:**

    - **Web:** Chỉ dùng được `ws://` (không an toàn) hoặc `wss://` (có SSL/TLS).
    - **ESP32:** Có thể chọn TCP thô (nhẹ, nhanh) hoặc WS (nặng hơn, tốn RAM hơn để xử lý frame).

3.  **Dữ liệu:**
    - **Web:** Dữ liệu nhận về thường là String hoặc Blob, dễ dàng `JSON.parse()`.
    - **ESP32:** Dữ liệu là mảng byte (`uint8_t *`), phải ép kiểu thủ công và cẩn thận tràn bộ nhớ khi xử lý chuỗi JSON lớn.
