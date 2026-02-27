# Energy Saving Dashboard

## Hướng dẫn sử dụng MQTT/WebSocket với JavaScript

### 1. Tổng quan về WebSocket

**WebSocket** là một giao thức mạng cho phép thiết lập một kết nối hai chiều (full-duplex) lâu dài giữa client (trình duyệt, thiết bị IoT, AI Box,...) và server. Điều này giúp truyền dữ liệu real-time với độ trễ thấp, rất phù hợp cho các ứng dụng IoT, dashboard, AI assistant, v.v.

#### a. Sự khác biệt giữa ws:// và wss://

- `ws://` (WebSocket): Kết nối WebSocket thông thường, không mã hóa, tương tự như HTTP.
- `wss://` (WebSocket Secure): Kết nối WebSocket được mã hóa qua TLS/SSL, tương tự như HTTPS. Dữ liệu truyền đi được bảo vệ khỏi nghe lén và giả mạo.

> **Khuyến nghị:** Khi triển khai trên môi trường thực tế (production), luôn sử dụng `wss://` để đảm bảo an toàn dữ liệu, đặc biệt khi truyền thông tin nhạy cảm hoặc điều khiển thiết bị từ xa.

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

### 2. Cách triển khai MQTT/WebSocket trong JavaScript

#### a. Cài đặt thư viện

```bash
npm install mqtt
```

#### b. Kết nối tới MQTT Broker

File: `src/services/mqttService.js`

```js
import mqtt from "mqtt";

const MQTT_TOKEN = "<token>"; // Thay bằng token thực tế
const host = "mqtt1.eoh.io";
const protocol = "wss";
const port = 8084;
const connectUrl = `${protocol}://${host}:${port}`;

const client = mqtt.connect(connectUrl, {
  clientId: `mqtt_web_${Math.random().toString(16).slice(3)}`,
  username: MQTT_TOKEN,
  password: MQTT_TOKEN,
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 2000,
});

client.on("connect", () => {
  console.log("Connected to MQTT Broker");
});

client.on("message", (topic, payload) => {
  const message = payload.toString();
  // Xử lý message tại đây
});

client.on("error", (err) => {
  console.error("Connection error: ", err);
  client.end();
});
```

#### c. Đăng ký (subscribe) và hủy đăng ký (unsubscribe) topic

```js
// Đăng ký nhận dữ liệu từ topic
client.subscribe("ten/topic", { qos: 1 }, (err) => {
  if (err) console.error("Subscribe error", err);
});

// Hủy đăng ký topic
client.unsubscribe("ten/topic");
```

#### d. Gửi dữ liệu lên topic

```js
client.publish("ten/topic", "noi_dung_message");
```

#### e. Ngắt kết nối

```js
client.end();
```

### 3. Lưu ý

- Sử dụng giao thức `wss` (WebSocket Secure) để đảm bảo bảo mật khi kết nối từ trình duyệt.
- Token và các thông tin nhạy cảm nên được bảo vệ, không public lên client nếu không cần thiết.
- Có thể tái sử dụng các hàm trong `src/services/mqttService.js` để quản lý kết nối, subscribe, unsubscribe, disconnect.

### 4. Tham khảo nhanh các hàm chính trong `mqttService.js`

- `connectMqtt(onMessage, onConnect)`: Kết nối và thiết lập callback khi có message hoặc khi kết nối thành công.
- `subscribeToTopic(topic)`: Đăng ký topic.
- `unsubscribeFromTopic(topic)`: Hủy đăng ký topic.
- `disconnectMqtt()`: Ngắt kết nối.

---

## Các phần khác của README giữ nguyên nội dung cũ bên dưới nếu có.
