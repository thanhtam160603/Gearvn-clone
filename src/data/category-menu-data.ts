import type { CategoryMenu } from "../types/category-menu";

export const categoryMenuData: CategoryMenu[] = [
  {
    id: "laptop",
    title: "Laptop",
    groups: [
      { title: "Thương hiệu", items: ["ASUS", "Acer", "MSI", "Lenovo", "Dell", "HP"] },
      { title: "Nhu cầu sử dụng", items: ["Laptop văn phòng", "Laptop sinh viên", "Laptop đồ họa", "Laptop AI"] },
      { title: "Khoảng giá", items: ["Dưới 15 triệu", "15 - 25 triệu", "25 - 40 triệu", "Trên 40 triệu"] },
      { title: "Dòng laptop nổi bật", items: ["ASUS Vivobook", "Acer Aspire", "Lenovo IdeaPad", "Dell Inspiron"] },
    ],
  },
  {
    id: "laptop-gaming",
    title: "Laptop Gaming",
    groups: [
      { title: "Thương hiệu", items: ["ASUS ROG", "ASUS TUF", "Acer Nitro", "MSI", "Lenovo Legion"] },
      { title: "Card đồ họa", items: ["RTX 3050", "RTX 4050", "RTX 4060", "RTX 4070", "RTX 5070"] },
      { title: "Kích thước màn hình", items: ["14 inch", "15.6 inch", "16 inch", "17 inch"] },
      { title: "Dòng sản phẩm", items: ["ROG Strix", "TUF Gaming", "Predator", "Nitro", "Legion"] },
    ],
  },
  {
    id: "pc-gvn",
    title: "PC GVN",
    groups: [
      { title: "Theo nhu cầu", items: ["PC Gaming", "PC văn phòng", "PC đồ họa", "PC streaming"] },
      { title: "Theo tầm giá", items: ["Dưới 15 triệu", "15 - 25 triệu", "25 - 40 triệu", "Trên 40 triệu"] },
      { title: "Theo cấu hình", items: ["PC Core i3", "PC Core i5", "PC Core i7", "PC Core i9", "PC Ryzen"] },
      { title: "Dòng PC nổi bật", items: ["PC GVN Gaming", "PC GVN Creator", "PC GVN AI", "PC GVN cao cấp"] },
    ],
  },
  {
    id: "main-cpu-vga",
    title: "Main, CPU, VGA",
    groups: [
      { title: "CPU Intel", items: ["Core i3", "Core i5", "Core i7", "Core i9", "Core Ultra"] },
      { title: "CPU AMD", items: ["Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9", "Threadripper"] },
      { title: "Card đồ họa", items: ["RTX 3050", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 5090"] },
      { title: "Mainboard", items: ["Mainboard Intel", "Mainboard AMD", "Mainboard ASUS", "Mainboard MSI", "Mainboard Gigabyte"] },
    ],
  },
  {
    id: "case-nguon-tan",
    title: "Case, Nguồn, Tản",
    groups: [
      { title: "Case máy tính", items: ["Case Mini Tower", "Case Mid Tower", "Case Full Tower", "Case kính cường lực"] },
      { title: "Nguồn máy tính", items: ["Nguồn 500W", "Nguồn 650W", "Nguồn 750W", "Nguồn 850W trở lên"] },
      { title: "Tản nhiệt CPU", items: ["Tản khí", "Tản nhiệt nước 120mm", "Tản nhiệt nước 240mm", "Tản nhiệt nước 360mm"] },
      { title: "Thương hiệu", items: ["Corsair", "Cooler Master", "NZXT", "Deepcool", "Lian Li"] },
    ],
  },
  {
    id: "storage-memory",
    title: "Ổ cứng, RAM, Thẻ nhớ",
    groups: [
      { title: "Ổ cứng SSD", items: ["SSD SATA", "SSD NVMe Gen 3", "SSD NVMe Gen 4", "SSD NVMe Gen 5"] },
      { title: "Ổ cứng HDD", items: ["HDD 1TB", "HDD 2TB", "HDD 4TB", "HDD NAS"] },
      { title: "RAM", items: ["RAM laptop", "RAM desktop", "DDR4", "DDR5", "RAM gaming RGB"] },
      { title: "Thẻ nhớ và USB", items: ["Thẻ nhớ MicroSD", "Thẻ nhớ SD", "USB 3.0", "USB Type-C"] },
    ],
  },
  {
    id: "audio-video",
    title: "Loa, Micro, Webcam",
    groups: [
      { title: "Loa", items: ["Loa vi tính", "Loa Bluetooth", "Loa soundbar", "Loa gaming"] },
      { title: "Microphone", items: ["Micro USB", "Micro XLR", "Micro streaming", "Micro thu âm"] },
      { title: "Webcam", items: ["Webcam Full HD", "Webcam 2K", "Webcam 4K", "Webcam có nắp che"] },
      { title: "Thương hiệu", items: ["Logitech", "Razer", "HyperX", "Havit", "Fifine"] },
    ],
  },
  {
    id: "monitor",
    title: "Màn hình",
    groups: [
      { title: "Theo kích thước", items: ["Màn hình 24 inch", "Màn hình 27 inch", "Màn hình 32 inch", "Màn hình Ultrawide"] },
      { title: "Theo nhu cầu", items: ["Màn hình Gaming", "Màn hình đồ họa", "Màn hình văn phòng", "Màn hình OLED"] },
      { title: "Theo tần số quét", items: ["144Hz", "165Hz", "180Hz", "240Hz", "360Hz"] },
      { title: "Thương hiệu", items: ["ASUS", "LG", "Samsung", "AOC", "ViewSonic", "Dell"] },
    ],
  },
  {
    id: "keyboard",
    title: "Bàn phím",
    groups: [
      { title: "Loại bàn phím", items: ["Bàn phím cơ", "Bàn phím văn phòng", "Bàn phím không dây", "Bàn phím low profile"] },
      { title: "Layout", items: ["60%", "65%", "75%", "TKL", "Fullsize"] },
      { title: "Tính năng", items: ["Hot-swap", "RGB", "Bluetooth", "QMK/VIA"] },
      { title: "Thương hiệu", items: ["AKKO", "Keychron", "Logitech", "Razer", "Corsair", "Leopold"] },
    ],
  },
  {
    id: "mouse",
    title: "Chuột + Lót chuột",
    groups: [
      { title: "Loại chuột", items: ["Chuột Gaming", "Chuột không dây", "Chuột văn phòng", "Chuột công thái học"] },
      { title: "Kết nối", items: ["Wireless", "Bluetooth", "Có dây", "Multi-mode"] },
      { title: "DPI và trọng lượng", items: ["Dưới 70g", "70 - 100g", "Trên 100g", "Từ 20.000 DPI"] },
      { title: "Thương hiệu", items: ["Logitech", "Razer", "ASUS", "Corsair", "DareU", "Rapoo"] },
    ],
  },
  {
    id: "headset",
    title: "Tai nghe",
    groups: [
      { title: "Loại tai nghe", items: ["Tai nghe Gaming", "Tai nghe Bluetooth", "Tai nghe chụp tai", "Tai nghe in-ear"] },
      { title: "Tính năng", items: ["Âm thanh 7.1", "Chống ồn chủ động", "Microphone rời", "Kết nối không dây"] },
      { title: "Nhu cầu", items: ["Chơi game", "Nghe nhạc", "Làm việc", "Học tập trực tuyến"] },
      { title: "Thương hiệu", items: ["HyperX", "Logitech", "Razer", "Sony", "SteelSeries"] },
    ],
  },
  {
    id: "chair-desk",
    title: "Ghế - Bàn",
    groups: [
      { title: "Ghế", items: ["Ghế gaming", "Ghế công thái học", "Ghế văn phòng", "Ghế chân quỳ"] },
      { title: "Bàn", items: ["Bàn gaming", "Bàn nâng hạ", "Bàn chữ L", "Bàn văn phòng"] },
      { title: "Phụ kiện bàn ghế", items: ["Kê chân", "Kê tay", "Giá treo màn hình", "Khay đi dây"] },
      { title: "Thương hiệu", items: ["Warrior", "E-Dra", "HyperWork", "Sihoo", "DXRacer"] },
    ],
  },
  {
    id: "software-network",
    title: "Phần mềm, mạng",
    groups: [
      { title: "Phần mềm", items: ["Windows", "Microsoft 365", "Phần mềm diệt virus", "Phần mềm bản quyền"] },
      { title: "Thiết bị mạng", items: ["Router Wi-Fi", "Mesh Wi-Fi", "Switch mạng", "Card mạng"] },
      { title: "Phụ kiện mạng", items: ["Cáp mạng", "Đầu mạng", "Tủ mạng", "Bộ phát 4G/5G"] },
      { title: "Thương hiệu", items: ["TP-Link", "ASUS", "Tenda", "Ubiquiti", "D-Link"] },
    ],
  },
  {
    id: "console",
    title: "Handheld, Console",
    groups: [
      { title: "Máy chơi game", items: ["PlayStation 5", "Xbox Series", "Nintendo Switch", "Steam Deck"] },
      { title: "Máy handheld", items: ["ROG Ally", "Legion Go", "Steam Deck OLED", "Nintendo Switch Lite"] },
      { title: "Phụ kiện console", items: ["Tay cầm", "Dock sạc", "Bao da", "Thẻ nhớ"] },
      { title: "Game và dịch vụ", items: ["Đĩa game", "Thẻ nạp", "PlayStation Plus", "Xbox Game Pass"] },
    ],
  },
  {
    id: "accessories",
    title: "Phụ kiện (Hub, sạc, cáp...)",
    groups: [
      { title: "Hub và bộ chuyển đổi", items: ["Hub USB", "Hub Type-C", "Docking Station", "Cáp chuyển HDMI"] },
      { title: "Sạc và nguồn", items: ["Củ sạc", "Sạc laptop", "Sạc GaN", "Pin dự phòng"] },
      { title: "Cáp kết nối", items: ["Cáp HDMI", "Cáp DisplayPort", "Cáp USB", "Cáp mạng"] },
      { title: "Phụ kiện tiện ích", items: ["Giá đỡ laptop", "Balo laptop", "Túi chống sốc", "Miếng dán màn hình"] },
    ],
  },
  {
    id: "services",
    title: "Dịch vụ và thông tin khác",
    groups: [
      { title: "Dịch vụ GEARVN", items: ["Lắp ráp PC", "Vệ sinh máy tính", "Nâng cấp máy tính", "Cài đặt phần mềm"] },
      { title: "Hỗ trợ khách hàng", items: ["Tra cứu bảo hành", "Tra cứu hóa đơn", "Chính sách đổi trả", "Chính sách giao hàng"] },
      { title: "Thông tin", items: ["Tin tức công nghệ", "Review sản phẩm", "Tư vấn chọn mua", "Khuyến mãi"] },
      { title: "Hệ thống GEARVN", items: ["Hệ thống showroom", "Liên hệ", "Tuyển dụng", "Trung tâm bảo hành"] },
    ],
  },
];
