# Hướng dẫn React JS dành cho Developer C++/JS truyền thống

Tài liệu này tổng hợp các kiến thức cơ bản về React, so sánh với tư duy lập trình truyền thống (C++/JS thuần) để giúp bạn dễ dàng tiếp cận.

---

## 1. Tư duy cốt lõi: Imperative vs. Declarative

- **C++ / JS Thuần (Imperative - Mệnh lệnh):** Bạn phải chỉ rõ _từng bước_ để thay đổi giao diện.
  - _Ví dụ:_ "Tìm cái nút ID là 'btn', gán sự kiện click, khi click thì tìm cái div 'modal', đổi style display thành 'none'."
- **React (Declarative - Khai báo):** Bạn chỉ cần mô tả giao diện _trông như thế nào_ dựa trên dữ liệu (State).
  - _Ví dụ:_ "Nếu biến `showModal` là `true` thì vẽ cái Modal. Nếu `false` thì không vẽ." (React tự lo việc thêm/xóa DOM).

---

## 2. Cấu trúc chung của một Component

Trong React hiện đại, mọi thứ đều là **Function** (Hàm). Một Component thực chất chỉ là một hàm trả về giao diện (JSX).

```jsx
// Tên Component phải viết hoa chữ cái đầu (PascalCase)
const MyComponent = (props) => {
  // 1. Khai báo biến/state (Logic)
  const [count, setCount] = useState(0);

  // 2. Các hàm xử lý (Helper functions)
  const handleClick = () => {
    setCount(count + 1);
  };

  // 3. Return ra giao diện (JSX)
  return (
    <div>
      <h1>Số đếm: {count}</h1>
      <button onClick={handleClick}>Tăng</button>
    </div>
  );
};
```

---

## 3. Hooks: "Phép thuật" của React

Vì Component là hàm (chạy xong là mất biến cục bộ), React cung cấp **Hooks** để "móc" vào các tính năng của React như lưu trạng thái hay vòng đời.

### 3.1. `useState` - Bộ nhớ của Component

- **C++:** Bạn khai báo biến thành viên trong class: `int count = 0;`. Khi muốn đổi, bạn gán `count = 5;`.
- **React:** Bạn dùng `useState`.

```javascript
const [state, setState] = useState(initialValue);
```

- `state`: Tên biến để đọc giá trị hiện tại.
- `setState`: Hàm **duy nhất** để thay đổi giá trị.
- **Quy tắc vàng:** Không bao giờ gán trực tiếp `state = 5`. Phải dùng `setState(5)`. Khi `setState` được gọi, React sẽ chạy lại hàm Component để vẽ lại giao diện mới.

### 3.2. `useEffect` - Vòng đời & Tác vụ phụ (Side Effects)

Dùng để xử lý những việc nằm ngoài luồng render chính: gọi API, đăng ký sự kiện, set timer. Nó thay thế cho Constructor và Destructor trong C++.

```javascript
useEffect(() => {
  // Code chạy khi component được sinh ra (Mount)
  // Hoặc chạy khi biến trong [dependency] thay đổi
  console.log("Component đã load hoặc count đã đổi");

  // (Tùy chọn) Hàm dọn dẹp - Chạy khi component bị hủy (Unmount)
  return () => {
    console.log("Dọn dẹp bộ nhớ...");
  };
}, [dependency]); // Mảng phụ thuộc
```

- `[]`: Chạy 1 lần duy nhất sau khi render lần đầu (Giống Constructor).
- `[count]`: Chạy mỗi khi biến `count` thay đổi.
- Không có mảng: Chạy sau MỌI lần render (Ít dùng, dễ gây chậm).

---

## 4. Syntax & Các mẫu code thường gặp

### 4.1. JSX (JavaScript XML)

Viết HTML trong JS.

- Dùng `{ }` để chèn code JS vào giữa HTML.
- `class` đổi thành `className` (vì `class` là từ khóa của JS).

### 4.2. Props - Truyền tham số

Giống như truyền tham số vào hàm trong C++.

- **Cha truyền:**
  ```jsx
  <AddACModal title="Thêm mới" isActive={true} />
  ```
- **Con nhận:**
  ```jsx
  const AddACModal = ({ title, isActive }) => {
    // Dùng title và isActive như biến bình thường
  };
  ```

### 4.3. Callback - Truyền hàm (Tư duy "Cái Remote")

Đây là cách Component con giao tiếp ngược lại với Component cha.

- **Vấn đề:** Con không thể sửa biến của Cha.
- **Giải pháp:** Cha đưa cho Con một cái hàm (cái remote). Khi cần, Con gọi hàm đó.

```jsx
// CHA (Dashboard)
const handleClose = () => setShow(false);
return <Modal onClose={handleClose} />;

// CON (Modal)
// onClose chính là cái hàm handleClose của cha
return <button onClick={onClose}>Đóng</button>;
```

### 4.4. Tại sao lại là `() => ham()`?

Khi gán sự kiện, bạn hay thấy 2 kiểu:

1.  `onClick={handleClick}`:
    - Đúng. Truyền **tham chiếu** hàm. Khi click mới chạy.
2.  `onClick={handleClick()}`:
    - Sai (thường là vậy). Hàm chạy **ngay lập tức** khi render.
3.  `onClick={() => handleClick(id)}`:
    - Đúng. Dùng khi cần truyền tham số. Tạo một hàm vô danh, khi click thì hàm vô danh chạy -> gọi `handleClick(id)`.

### 4.5. Conditional Rendering (Hiển thị có điều kiện)

Thay vì `if/else` dài dòng, React dùng toán tử `&&`.

```jsx
{
  showModal && <Modal />;
}
```

- Nghĩa là: Nếu `showModal` là `true` -> Vẽ Modal. Nếu `false` -> Bỏ qua.

### 4.6. Rendering Lists (Vòng lặp)

Thay vì `for`, React dùng `.map()` để biến mảng dữ liệu thành mảng giao diện.

```jsx
{
  users.map((user) => <div key={user.id}>{user.name}</div>);
}
```

- **Lưu ý:** Luôn phải có `key` (ID duy nhất) để React tối ưu hiệu năng.

---

## 5. Tổng kết luồng đi của dữ liệu

1.  **State** nằm ở đâu, component đó quản lý dữ liệu đó.
2.  Dữ liệu chảy **từ trên xuống dưới** (Cha -> Con) qua **Props**.
3.  Hành động (Sự kiện) gửi **từ dưới lên trên** (Con -> Cha) qua **Callback functions**.

---

## 6. Routing (Điều hướng trang)

Trong C++ Desktop App (như Qt, MFC), bạn có các cửa sổ (Window/Dialog). Trong Web truyền thống, bạn có các file HTML (`index.html`, `about.html`).
Nhưng React là **SPA (Single Page Application)** - Ứng dụng một trang duy nhất.

### 6.1. Route là gì?

Thực chất, toàn bộ ứng dụng chỉ có **1 file HTML duy nhất**.
"Chuyển trang" trong React thực ra là một cú lừa thị giác:

1.  Nhìn lên thanh địa chỉ URL thấy đổi từ `/` sang `/about`.
2.  React chặn sự kiện tải lại trang.
3.  React xóa Component `Home` đi, vẽ Component `About` vào chỗ đó.

### 6.2. Cấu trúc cơ bản (React Router)

Thư viện phổ biến nhất là `react-router-dom`.

```jsx
// App.jsx - Nơi định nghĩa bản đồ đường đi
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Nếu URL là /, hiện trang Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Nếu URL là /bills, hiện trang BillManagement */}
        <Route path="/bills" element={<BillManagement />} />

        {/* Nếu URL là /control/123, hiện trang ControlPanel */}
        <Route path="/control/:id" element={<ControlPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 6.3. Cách chuyển trang (Link & useNavigate)

- **Dùng thẻ `<a>` (Không nên):** `<a href="/bills">Bills</a>` -> Sẽ làm tải lại cả trang web (F5), mất hết state hiện tại.
- **Dùng thẻ `<Link>` (Nên dùng):**
  ```jsx
  import { Link } from "react-router-dom";
  <Link to="/bills">Quản lý hóa đơn</Link>;
  ```
  -> Chuyển trang mượt mà, không reload.
- **Dùng Code (useNavigate):**

  ```jsx
  import { useNavigate } from "react-router-dom";

  const Login = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
      // ...xử lý login xong...
      navigate("/dashboard"); // Chuyển hướng bằng code
    };
  };
  ```

---

## 7. Quản lý & Chuyển dữ liệu giữa các Pages

Trong ứng dụng React (Single Page Application), việc chuyển trang thực chất chỉ là ẩn component này và hiện component kia. Dữ liệu không tự nhiên "bay" từ trang A sang trang B được. Có 3 cách chính để xử lý việc này:

### 6.1. Cách 1: URL Params (Dùng cho ID, từ khóa tìm kiếm)

Dùng khi dữ liệu ngắn gọn và cần hiển thị trên thanh địa chỉ để user có thể bookmark/share.

- **Gửi đi (Trang A):**
  ```jsx
  // Chuyển sang trang chi tiết có ID là 123
  navigate("/control/123");
  ```
- **Định nghĩa Route (App.jsx):**
  ```jsx
  <Route path="/control/:id" element={<ControlPanel />} />
  ```
- **Nhận về (Trang B - ControlPanel):**

  ```jsx
  import { useParams } from "react-router-dom";

  const ControlPanel = () => {
    const { id } = useParams(); // Lấy được chuỗi "123"
    // Dùng ID này để gọi API lấy dữ liệu chi tiết
  };
  ```

### 6.2. Cách 2: Global State / Context (Dùng cho User login, Theme, Ngôn ngữ)

Dùng khi dữ liệu cần được truy cập bởi **nhiều trang khác nhau** mà không muốn truyền qua lại phức tạp. (Giống biến Global hoặc Singleton trong C++).

- **Tạo Kho chứa (Context):**
  ```jsx
  // Tạo một cái kho chung
  export const UserContext = createContext();
  ```
- **Cung cấp dữ liệu (Provider - Thường ở file gốc main.jsx/App.jsx):**
  ```jsx
  <UserContext.Provider value={{ user, logout }}>
    <App /> {/* Tất cả con cháu trong App đều truy cập được */}
  </UserContext.Provider>
  ```
- **Sử dụng ở bất kỳ đâu:**
  ```jsx
  const { user } = useContext(UserContext);
  ```

### 6.3. Cách 3: State Management Library (Redux, Zustand)

Dùng cho ứng dụng lớn, dữ liệu phức tạp. (Tương tự Context nhưng mạnh mẽ hơn, có công cụ debug chuyên nghiệp).

### 6.4. Cách 4: LocalStorage (Lưu cứng xuống trình duyệt)

Dùng khi muốn dữ liệu vẫn còn đó ngay cả khi user tắt trình duyệt bật lại (F5).

- **Lưu:** `localStorage.setItem('token', 'abc-xyz');`
- **Đọc:** `const token = localStorage.getItem('token');`

---

## 8. Redux - Quản lý State chuyên sâu (Mô hình Ngân hàng Trung ương)

Nếu `useState` là ví tiền cá nhân của Component, thì **Redux** là **Ngân hàng Trung ương**.

### 8.1. Tại sao cần Redux? (Vấn đề Prop Drilling)

Hãy tưởng tượng bạn có một cây gia phả 10 đời.

- Cụ tổ (App) có một món gia bảo (Data).
- Cháu đời thứ 10 (Button) cần dùng món đó.
- **Cách thường:** Cụ tổ đưa cho ông cố -> ông nội -> cha -> con -> cháu... (Truyền Props qua 10 tầng). Rất mệt mỏi và dễ rơi rớt.
- **Cách Redux:** Cụ tổ cất món đó vào "Kho chung". Cháu đời thứ 10 tự đi ra kho lấy.

### 8.2. Mô hình hóa: Redux hoạt động như một Ngân hàng

Để hiểu Redux, hãy quên code đi và tưởng tượng quy trình rút tiền tại ngân hàng ngày xưa.

#### Các nhân vật chính:

1.  **The Store (Cái Két sắt/Cuốn sổ cái):**

    - Nơi chứa TOÀN BỘ tiền (dữ liệu) của ứng dụng.
    - **Quy tắc:** Không ai được tự ý mở két sắt lấy tiền. Két sắt là "Bất khả xâm phạm" (Immutable).

2.  **The View / Component (Khách hàng):**

    - Là giao diện người dùng (UI).
    - Khách hàng muốn rút tiền, nhưng không được tự vào kho lấy.

3.  **Action (Phiếu yêu cầu):**

    - Khách hàng phải điền vào một tờ phiếu.
    - Trên phiếu ghi rõ: `LOẠI_GIAO_DỊCH: RÚT_TIỀN` và `SỐ_TIỀN: 500`.
    - Đây chỉ là một tờ giấy (Object thuần), chưa có gì xảy ra cả.

4.  **Dispatch (Nhân viên bảo vệ/Người đưa thư):**

    - Khách hàng đưa tờ phiếu (Action) cho Dispatch.
    - Dispatch cầm tờ phiếu chạy vào phòng xử lý.

5.  **Reducer (Giao dịch viên/Kế toán):**
    - Đây là người duy nhất được phép tính toán.
    - Giao dịch viên cầm **Cuốn sổ cái cũ** (Current State) và **Tờ phiếu** (Action).
    - Họ tính toán: `Số dư cũ (1000) - Rút (500) = Số dư mới (500)`.
    - **QUAN TRỌNG (Tư duy C++ cần đổi):** Giao dịch viên **KHÔNG** gạch xóa đè lên dòng cũ trong cuốn sổ. Họ **XÉ BỎ** trang cũ, viết lại toàn bộ sang một **TRANG MỚI** (New State Object). Đây là tính Bất biến (Immutability).

### 8.3. Luồng đi của dữ liệu (Unidirectional Data Flow)

```mermaid
graph LR
    A[Khách hàng (UI)] -->|Điền phiếu (Action)| B(Dispatch)
    B -->|Đưa phiếu| C{Giao dịch viên (Reducer)}
    C -->|Lấy sổ cũ| D[(Két sắt - Store)]
    C -->|Viết sổ mới| D
    D -->|Thông báo số dư mới| A
```

### 8.4. Code minh họa

**1. Action (Tờ phiếu):**

```javascript
const rutTienAction = {
  type: "RUT_TIEN",
  payload: 500,
};
```

**2. Reducer (Giao dịch viên):**

```javascript
// state: Số dư hiện tại (Mặc định 1000)
// action: Tờ phiếu
function bankReducer(state = { balance: 1000 }, action) {
  switch (action.type) {
    case "RUT_TIEN":
      // KHÔNG ĐƯỢC: state.balance -= action.payload (Sai! Cấm sửa trực tiếp)

      // ĐÚNG: Tạo ra một object hoàn toàn mới (Copy state cũ, ghi đè giá trị mới)
      return {
        ...state,
        balance: state.balance - action.payload,
      };
    default:
      return state;
  }
}
```

**3. Component (Khách hàng):**

```jsx
import { useDispatch, useSelector } from "react-redux";

const ATM = () => {
  // useSelector: Nhìn vào két sắt xem số dư (Subscription)
  const balance = useSelector((state) => state.balance);

  // useDispatch: Thuê một người đưa thư
  const dispatch = useDispatch();

  const handleWithdraw = () => {
    // Điền phiếu và đưa cho người đưa thư
    dispatch({ type: "RUT_TIEN", payload: 500 });
  };

  return (
    <div>
      <h1>Số dư: {balance}</h1>
      <button onClick={handleWithdraw}>Rút 500k</button>
    </div>
  );
};
```

### 8.5. So sánh với C++

- **Redux Store** giống như một **Singleton Class** khổng lồ chứa toàn bộ dữ liệu.
- Tuy nhiên, trong C++, bạn có thể `Singleton::getInstance()->value = 5;` (Gán trực tiếp).
- Trong Redux, setter bị private. Bạn chỉ có thể gọi `sendMessage(COMMAND_ID, data)` (tương ứng với Dispatch Action) và bên trong Singleton sẽ tự xử lý việc update.
