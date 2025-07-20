module.exports = {
    // Cấu hình Lavalink Server
    lavalink: {
        // Thông tin kết nối Lavalink
        nodes: [
            {
                name: "Lavalink Main",
                url: "localhost:2333", // Địa chỉ Lavalink server
                auth: "youshallnotpass", // Mật khẩu Lavalink
                secure: false, // true nếu dùng SSL
                retryAmount: 3, // Số lần thử kết nối lại
                retryDelay: 5000, // Thời gian chờ giữa các lần thử (ms)
            }
        ],
        
        // Cấu hình mặc định cho player
        defaultSearchEngine: "youtube", // youtube, soundcloud, spotify, etc.
        
        // Cấu hình audio
        audioOptions: {
            quality: "high", // low, medium, high
            bitrate: 128, // Bitrate cho audio
            volume: 100, // Volume mặc định
        },
        
        // Cấu hình queue
        queueOptions: {
            maxSize: 100, // Số bài hát tối đa trong queue
            leaveOnEmpty: true, // Rời voice khi không có ai
            leaveOnEmptyCooldown: 5000, // Thời gian chờ trước khi rời
            leaveOnEnd: true, // Rời voice khi hết bài
            leaveOnEndCooldown: 50000, // Thời gian chờ sau khi hết bài
        }
    },
    
    // Cấu hình fallback (nếu Lavalink không hoạt động)
    fallback: {
        enabled: true, // Bật fallback về discord-player
        useDiscordPlayer: true, // Sử dụng discord-player làm backup
    }
}; 