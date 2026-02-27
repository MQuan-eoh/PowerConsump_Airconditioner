# Tài liệu Triển khai: Theo dõi Điện năng Tiêu thụ Hàng ngày (Daily Power Consumption)

Tài liệu này giải thích chi tiết về việc nâng cấp hệ thống để hỗ trợ tính năng theo dõi điện năng tiêu thụ chính xác theo ngày, phục vụ cho việc hiển thị biểu đồ tuần.

## 1. Vấn đề & Giải pháp

### Vấn đề

Hệ thống cũ chỉ lưu trữ một giá trị `dailyBaseline` (chỉ số công tơ điện tại thời điểm bắt đầu ngày). Khi hiển thị biểu đồ tuần:

- Ta biết chỉ số đầu ngày (`beginPW`).
- Nhưng với các ngày trong quá khứ, ta không biết chỉ số cuối ngày đó là bao nhiêu để tính toán lượng điện tiêu thụ (`kWh = Cuối - Đầu`).

### Giải pháp

Chuyển đổi cấu trúc lưu trữ dữ liệu `daily_powerConsumption` từ một số đơn lẻ sang một đối tượng chứa hai trường:

- **`beginPW`**: Chỉ số điện năng tại thời điểm 00:00 (Đầu ngày).
- **`endPW`**: Chỉ số điện năng tại thời điểm 23:59 hoặc lần ghi nhận cuối cùng trong ngày (Cuối ngày).

Công thức tính kWh:
$$ \text{kWh trong ngày} = \text{endPW} - \text{beginPW} $$

---

## 2. Luồng dữ liệu (Data Flow)

Quy trình hoạt động của hệ thống sau khi cập nhật:

1.  **Khởi tạo (00:00 - 00:02)**:

    - Hệ thống (Client) gọi API lấy lịch sử dữ liệu từ E-RA trong khoảng thời gian đầu ngày.
    - Giá trị đầu tiên tìm thấy được lưu vào Firebase dưới trường `beginPW`.

2.  **Trong ngày (Real-time)**:

    - Thiết bị IoT gửi dữ liệu liên tục lên E-RA.
    - Ứng dụng React nhận dữ liệu này thông qua `useEra` hook.
    - **Cơ chế Debounce**: Thay vì lưu liên tục mỗi giây, ứng dụng đợi giá trị ổn định trong 5 giây rồi mới cập nhật vào trường `endPW` trên Firebase.

3.  **Hiển thị Biểu đồ (Visualization)**:
    - Khi người dùng chọn xem theo "Tuần".
    - Ứng dụng tải dữ liệu 7 ngày gần nhất từ Firebase.
    - **Ngày quá khứ**: Tính `endPW - beginPW`.
    - **Ngày hôm nay**: Tính `Giá trị hiện tại (Real-time) - beginPW`.

---

## 3. Các Cú pháp & Kỹ thuật Lập trình (Syntax & Concepts)

### 3.1. Firebase: `set` vs `update`

Cách chúng ta tương tác với cơ sở dữ liệu Realtime Database.

- **`set(ref, value)`**:

  - **Khái niệm**: Ghi đè toàn bộ dữ liệu tại đường dẫn tham chiếu (`ref`).
  - **Áp dụng**: Dùng khi khởi tạo dữ liệu mới hoàn toàn hoặc muốn reset dữ liệu.
  - _Ví dụ_: `set(ref(...), { beginPW: 1000 })` -> Nếu trước đó có `endPW`, nó sẽ bị mất.

- **`update(ref, updates)`**:
  - **Khái niệm**: Chỉ cập nhật các trường được liệt kê, giữ nguyên các trường khác tại đường dẫn đó.
  - **Áp dụng**: Dùng để lưu `endPW` mà không làm mất `beginPW` đã lưu từ sáng.
  - _Ví dụ_: `update(ref(...), { endPW: 1050 })` -> `beginPW` vẫn còn nguyên.

### 3.2. Promise.all

Kỹ thuật xử lý bất đồng bộ song song.

- **Khái niệm**: Nhận vào một mảng các Promise (các tác vụ bất đồng bộ) và trả về một Promise mới chỉ hoàn thành khi **tất cả** các tác vụ con đều hoàn thành.
- **Áp dụng**: Khi tải dữ liệu cho 7 ngày trong tuần. Thay vì tải ngày 1 -> xong -> tải ngày 2 (mất 7s), ta tải cả 7 ngày cùng lúc (mất 1s).

```javascript
// Tạo mảng các tác vụ tải dữ liệu
const promises = days.map((date) => getDailyPowerData(acId, date));
// Chạy song song và đợi tất cả xong
const results = await Promise.all(promises);
```

### 3.3. Debouncing (Kỹ thuật chống spam)

- **Khái niệm**: Kỹ thuật giới hạn số lần thực thi của một hàm. Chỉ thực thi hàm sau khi một khoảng thời gian chờ đã trôi qua mà không có sự kiện mới nào xảy ra.
- **Áp dụng**: Tránh việc ghi vào Firebase quá nhiều lần (write heavy) khi chỉ số điện thay đổi liên tục.

---

## 4. React Hooks: Chi tiết `useState` và `useEffect`

Đây là hai khái niệm cốt lõi của React Functional Components.

### 4.1. `useState` - Quản lý Trạng thái

**Khái niệm**:
`useState` là một Hook cho phép bạn thêm state (biến trạng thái) vào functional component. Khi state thay đổi, React sẽ tự động render lại (vẽ lại) component để hiển thị dữ liệu mới.

**Cú pháp**:

```javascript
const [state, setState] = useState(initialValue);
```

- `state`: Tên biến chứa giá trị hiện tại.
- `setState`: Hàm dùng để cập nhật giá trị cho biến đó.
- `initialValue`: Giá trị khởi tạo ban đầu.

**Khi nào sử dụng?**:

- Khi bạn có dữ liệu thay đổi theo thời gian và bạn muốn giao diện (UI) cập nhật theo dữ liệu đó.
- Ví dụ: Lưu trữ danh sách lịch sử điện năng, lưu trạng thái loading, lưu giá trị baseline.

**Áp dụng trong hệ thống**:

```javascript
// Khai báo biến dailyBaseline, giá trị ban đầu là null
const [dailyBaseline, setDailyBaseline] = useState(null);

// Khi lấy được dữ liệu từ Firebase
setDailyBaseline(1000); // Giao diện sẽ tự động cập nhật nếu có hiển thị biến này
```

### 4.2. `useEffect` - Quản lý Tác vụ phụ (Side Effects)

**Khái niệm**:
`useEffect` cho phép bạn thực hiện các side effects trong functional component. Side effects bao gồm: gọi API, tương tác trực tiếp với DOM, thiết lập subscription, hoặc cài đặt timer.

**Cú pháp**:

```javascript
useEffect(() => {
  // Logic thực thi (Effect)

  return () => {
    // Logic dọn dẹp (Cleanup) - Tùy chọn
  };
}, [dependency1, dependency2]); // Mảng phụ thuộc (Dependencies)
```

**Các trường hợp sử dụng**:

1.  **Không có dependency array (`useEffect(() => { ... })`)**:

    - Chạy sau **mỗi lần** render. Ít dùng vì dễ gây vòng lặp vô hạn.

2.  **Dependency array rỗng (`useEffect(() => { ... }, [])`)**:

    - Chỉ chạy **một lần duy nhất** sau khi component được mount (xuất hiện lần đầu).
    - _Áp dụng_: Gọi API lấy thông tin AC khi vừa vào trang.

3.  **Có dependency array (`useEffect(() => { ... }, [prop, state])`)**:
    - Chạy lần đầu và chạy lại mỗi khi giá trị trong mảng dependency **thay đổi**.
    - _Áp dụng_: Khi `acId` thay đổi (người dùng chọn máy lạnh khác), cần tải lại dữ liệu của máy đó.

**Áp dụng trong hệ thống (Logic Debounce lưu endPW)**:

```javascript
useEffect(() => {
  // 1. Kiểm tra điều kiện: Phải có dữ liệu điện năng và ID máy
  if (!eraValues?.powerConsumption || !acId) return;

  // 2. Định nghĩa hàm lưu dữ liệu
  const saveEndValue = async () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    await saveDailyEndValue(
      acId,
      todayStr,
      parseFloat(eraValues.powerConsumption)
    );
  };

  // 3. Thiết lập Timer: Đợi 5 giây mới chạy hàm saveEndValue
  const timer = setTimeout(saveEndValue, 5000);

  // 4. Cleanup Function:
  // Nếu trong vòng 5 giây đó, eraValues thay đổi (useEffect chạy lại),
  // hàm này sẽ được gọi để HỦY timer cũ đi.
  // Kết quả: Chỉ khi nào eraValues ngừng thay đổi trong 5s, timer mới chạy hết và saveEndValue mới được gọi.
  return () => clearTimeout(timer);
}, [eraValues?.powerConsumption, acId]); // Dependency: Chạy lại khi điện năng hoặc ID thay đổi
```

## 5. Tổng kết thay đổi Code

### `src/services/firebaseService.js`

- Cập nhật `saveDailyBaseline`: Xử lý logic migration từ số sang object.
- Thêm `saveDailyEndValue`: Dùng `update` để lưu `endPW`.
- Thêm `getDailyPowerData`: Lấy cả object `{ beginPW, endPW }`.

### `src/pages/ControlPanel.jsx`

- Thêm `useEffect` để tự động lưu `endPW` (với debounce).
- Cập nhật logic `loadChartAndStats` để xử lý dữ liệu tuần dựa trên `beginPW` và `endPW`.
