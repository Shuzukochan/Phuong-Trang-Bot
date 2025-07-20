# 🎵 Hướng dẫn cài đặt Lavalink cho Phuong-Trang-Bot

## Tổng quan
Bot đã được cập nhật để hỗ trợ Lavalink - một hệ thống audio server mạnh mẽ cho Discord bots. Lavalink cung cấp chất lượng audio tốt hơn và ổn định hơn so với discord-player thông thường.

## 🔧 Yêu cầu hệ thống

### 1. Java Runtime Environment (JRE)
- **Phiên bản**: Java 11 hoặc cao hơn
- **Tải về**: https://adoptium.net/ hoặc https://www.oracle.com/java/technologies/downloads/

### 2. Lavalink Server
- **Tải về**: https://github.com/lavalink-devs/Lavalink/releases
- **File cần**: `Lavalink.jar`

## 📁 Cấu trúc thư mục
```
Phuong-Trang-Bot/
├── Lavalink.jar          # Lavalink server (tải về)
├── application.yml       # Cấu hình Lavalink (đã tạo)
├── start-lavalink.bat    # Script khởi động (đã tạo)
├── lavalink-config.js    # Cấu hình bot (đã tạo)
└── ... (các file khác)
```

## 🚀 Cài đặt và khởi động

### Bước 1: Tải Lavalink.jar
1. Truy cập https://github.com/lavalink-devs/Lavalink/releases
2. Tải file `Lavalink.jar` mới nhất
3. Đặt file vào thư mục gốc của bot

### Bước 2: Kiểm tra Java
```bash
java -version
```
Đảm bảo hiển thị Java 11+ 

### Bước 3: Khởi động Lavalink Server
**Cách 1: Sử dụng script (Windows)**
```bash
start-lavalink.bat
```

**Cách 2: Thủ công**
```bash
java -jar Lavalink.jar
```

### Bước 4: Khởi động Bot
```bash
npm start
```

## ⚙️ Cấu hình

### Cấu hình Lavalink Server (`application.yml`)
```yaml
server:
  port: 2333
  address: 127.0.0.1
lavalink:
  server:
    password: "youshallnotpass"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
```

### Cấu hình Bot (`lavalink-config.js`)
```javascript
module.exports = {
    lavalink: {
        nodes: [
            {
                name: "Lavalink Main",
                url: "localhost:2333",
                auth: "youshallnotpass",
                secure: false,
                retryAmount: 3,
                retryDelay: 5000,
            }
        ],
        defaultSearchEngine: "youtube",
        audioOptions: {
            quality: "high",
            bitrate: 128,
            volume: 100,
        },
        queueOptions: {
            maxSize: 100,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 5000,
            leaveOnEnd: true,
            leaveOnEndCooldown: 50000,
        }
    },
    fallback: {
        enabled: true,
        useDiscordPlayer: true,
    }
};
```

## 🔍 Kiểm tra trạng thái

### Command Discord
```
/lavalink-status
```

### Logs Console
Khi khởi động thành công, bạn sẽ thấy:
```
🎵 Initializing Lavalink Manager...
🔗 Connecting to Lavalink node: Lavalink Main
✅ Connected to Lavalink node: Lavalink Main
✅ Lavalink Manager initialized successfully
```

## 🛠️ Troubleshooting

### Lỗi "Connection refused"
- Đảm bảo Lavalink server đang chạy
- Kiểm tra port 2333 không bị chặn
- Kiểm tra firewall

### Lỗi "Java not found"
- Cài đặt Java 11+
- Thêm Java vào PATH
- Kiểm tra: `java -version`

### Bot fallback về Discord Player
- Lavalink server không khả dụng
- Bot sẽ tự động sử dụng discord-player
- Kiểm tra logs để biết lý do

### Lỗi "Invalid password"
- Kiểm tra password trong `application.yml` và `lavalink-config.js`
- Đảm bảo giống nhau: `youshallnotpass`

## 📊 So sánh hiệu suất

| Tính năng | Discord Player | Lavalink |
|-----------|----------------|----------|
| Chất lượng audio | Tốt | Tuyệt vời |
| Độ ổn định | Trung bình | Cao |
| Tài nguyên CPU | Cao | Thấp |
| Hỗ trợ nguồn | Hạn chế | Đầy đủ |
| Fallback | Không | Có |

## 🎯 Lợi ích của Lavalink

1. **Chất lượng audio tốt hơn**
2. **Tiết kiệm tài nguyên CPU**
3. **Hỗ trợ nhiều nguồn audio**
4. **Độ ổn định cao**
5. **Fallback tự động**
6. **Quản lý queue tốt hơn**

## 🔄 Chuyển đổi từ Discord Player

Bot đã được cấu hình để:
- Tự động thử kết nối Lavalink trước
- Fallback về Discord Player nếu Lavalink không khả dụng
- Giữ nguyên tất cả commands hiện tại
- Không cần thay đổi cách sử dụng

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs console
2. Sử dụng `/lavalink-status`
3. Đảm bảo Java và Lavalink.jar đúng
4. Kiểm tra cấu hình network 