# Phuong Trang Discord Bot

Phuong Trang Discord Bot là một bot Discord được phát triển để nâng cao trải nghiệm server Discord của bạn với nhiều tính năng đa dạng, sử dụng [discord.js](https://discord.js.org/) và [discord-player](https://discord-player.js.org/)

## Tính năng

- **Xử lý sự kiện**: Phản hồi với các sự kiện Discord khác nhau
- **Trình phát nhạc**: Phát nhạc với nhiều nguồn khác nhau
- **Lời bài hát**: Sử dụng Lrclib
  - syncedLyrics
  - plainLyrics
- **Điều khiển giọng nói**: Tích hợp AI assistant để tương tác qua giọng nói
- **Hỗ trợ đa ngôn ngữ**: Nhận diện và phản hồi bằng tiếng Việt

## Cài đặt

### Thiết lập bot

Đi tới [discord.dev](https://discord.dev/) để tạo ứng dụng của bạn

Bật Privileged Gateway Intents và reset token để thêm vào bước 3 bên dưới.

### Thiết lập dự án

1. Clone repository hoặc download project:

```bash
git clone [URL_REPOSITORY_CUA_BAN]
cd Phuong-Trang-Bot
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Thiết lập Firebase và environment variables:

- Tạo file `.env` với Firebase config (xem `FIREBASE_SETUP.md` để biết chi tiết):

```bash
TOKEN = "Your Bot Token"  # bắt buộc
FIREBASE_PROJECT_ID = "your-firebase-project-id"  # Firebase project ID
FIREBASE_PRIVATE_KEY = "your-private-key"  # Firebase service account private key
FIREBASE_CLIENT_EMAIL = "your-service-account@project.iam.gserviceaccount.com"  # Firebase service account email
...
```

- Đổi tên file config.js.example thành config.js

```js
module.exports = {
  deploy: true,
  defaultCooldownDuration: 5000,
  ImageSearch: true,
}
...
```

4. Test Firebase connection trước:

```bash
npm test
# hoặc
npm run test-firebase
```

5. Khởi động bot:

```bash
node .
# hoặc
npm run start
# hoặc cho dev (sử dụng nodemon)
npm run dev
```

## Sử dụng ngrok

1. Truy cập [ngrok's dashboard](https://dashboard.ngrok.com) và đăng nhập hoặc tạo tài khoản mới
2. Đi tới [Your Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken), copy token và paste vào `.env` -> `NGROK_AUTHTOKEN`
3. Đi tới [Domain](https://dashboard.ngrok.com/domains), tạo domain nếu chưa có và copy nó
4. Copy domain và paste vào `.env` -> `NGROK_DOMAIN` _(Domain có dạng `something.ngrok-free.app`)_

> [!IMPORTANT] Đừng tạo Edges nếu không nó sẽ không hoạt động

## Đóng góp

Chào mừng các đóng góp!

Nếu bạn có những thay đổi mà bạn nghĩ nên được thêm vào dự án, hãy gửi Pull Request trên GitHub

## License

Dự án này được cấp phép theo MIT License. Xem file [LICENSE](./LICENSE) để biết chi tiết.

## Liên hệ

Để biết thêm thông tin, vui lòng liên hệ qua GitHub issues.
