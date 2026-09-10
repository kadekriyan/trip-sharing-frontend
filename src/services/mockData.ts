import type { Destination, Trip, Driver, Participant, Article, AdminMetrics, AuditLog } from "@/src/types";

export const MOCK_DRIVERS: Driver[] = [
  {
    id: "drv-01",
    fullName: "Budi Pratama",
    phoneNumber: "+62 812-3456-7890",
    licenseNumber: "SIM-B1-889921",
    vehicleModel: "Toyota HiAce Premio Luxury",
    plateNumber: "B 1234 SAA",
    passengerCapacity: 6,
    status: "available",
    rating: 4.9,
    totalTrips: 142,
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    notes: "Spesialis rute Jawa Timur & Bali. Ramah, fasih berbahasa Inggris.",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "drv-02",
    fullName: "Wayan Sukerta",
    phoneNumber: "+62 813-8877-6655",
    licenseNumber: "SIM-B1-773344",
    vehicleModel: "Isuzu Elf Long Coaster",
    plateNumber: "DK 9988 AB",
    passengerCapacity: 6,
    status: "available",
    rating: 4.85,
    totalTrips: 98,
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    notes: "Pemandu lokal Bali & Lombok. Berpengalaman 8 tahun di jalur wisata alam.",
    createdAt: "2026-02-15T09:30:00Z",
    updatedAt: "2026-08-25T11:00:00Z",
  },
  {
    id: "drv-03",
    fullName: "Agus Salim",
    phoneNumber: "+62 811-2233-4455",
    licenseNumber: "SIM-B1-554411",
    vehicleModel: "Hyundai Staria Tourer",
    plateNumber: "L 7766 ZX",
    passengerCapacity: 6,
    status: "on_trip",
    rating: 4.95,
    totalTrips: 180,
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    notes: "Spesialis Bromo & Ijen Sunrise Safari.",
    createdAt: "2026-01-05T08:00:00Z",
    updatedAt: "2026-08-28T14:20:00Z",
  },
];

export const MOCK_DESTINATIONS: Destination[] = [
  {
    id: "dest-01",
    title: "Bromo Sunrise & Midnight Crater Shared Odyssey",
    slug: "bromo-sunrise-midnight-crater",
    tagline: "Saksikan magisnya golden hour di Bromo bersama teman perjalanan baru",
    description:
      "Perjalanan petualangan cost-sharing menjelajahi Gunung Bromo, Penanjakan 1 sunrise point, Kawah Bromo, Pasir Berbisik, dan Bukit Teletubbies menggunakan Jeep 4x4 & armada nyaman.",
    location: "Probolinggo, Jawa Timur",
    durationDays: 2,
    durationNights: 1,
    pricePerPax: 850000,
    coverImage: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1200&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80",
    ],
    inclusions: [
      "Transportasi Antar Jemput Surabaya/Malang",
      "Jeep 4x4 Bromo Private Group (Maks 6)",
      "Tiket Masuk TNBTS & Asuransi",
      "Dokumentasi Foto & Video",
      "Sarapan & Coffee Break Sunrise",
      "Pemandu Lokal Berpengalaman",
    ],
    exclusions: ["Pengeluaran Pribadi & Sewa Kuda", "Makan Siang/Malam di luar paket"],
    highlights: ["Sunrise di King Kong Hill", "Pendakian Tangga Kawah Bromo", "Sesi Foto Pasir Berbisik"],
    itinerary: [
      {
        day: 1,
        title: "Penjemputan & Perjalanan Malam",
        description: "Meeting point di Stasiun Malang / Surabaya Gubeng pukul 23:00 WIB, perjalanan menuju transit point Sukapura.",
        activities: ["23:00 - Kumpul & Briefing Tim", "00:30 - Perjalanan ke Sukapura"],
      },
      {
        day: 2,
        title: "Golden Sunrise & Eksplorasi Lautan Pasir",
        description: "Pindah ke Jeep 4x4 menuju Sunrise View Point, eksplorasi Kawah Bromo, Bukit Widodaren, dan kembali ke meeting point.",
        activities: [
          "03:30 - Tiba di Spot Sunrise Penanjakan",
          "05:15 - Menikmati Bromo Sunrise",
          "06:30 - Trekking ke Kawah Bromo",
          "08:30 - Foto di Pasir Berbisik & Savana",
          "11:00 - Kembali ke meeting point",
        ],
      },
    ],
    rating: 4.9,
    totalReviews: 248,
    isPopular: true,
    meetingPoint: "Stasiun Malang Kota Baru / Bandara Juanda Surabaya",
    maxGroupCapacity: 6,
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-08-20T00:00:00Z",
  },
  {
    id: "dest-02",
    title: "Komodo Island & Padar Shared Expedition",
    slug: "komodo-island-padar-expedition",
    tagline: "Eksplorasi Taman Nasional Komodo dengan Kapal Phinisi & Cost Sharing",
    description:
      "Berlayar bersama 6 traveler menjelajahi Pulau Padar, Pantai Pink, habitat Komodo di Loh Liang, dan snorkeling bersama Manta Ray.",
    location: "Labuan Bajo, Nusa Tenggara Timur",
    durationDays: 3,
    durationNights: 2,
    pricePerPax: 2650000,
    coverImage: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=1200&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=800&auto=format&fit=crop&q=80",
    ],
    inclusions: [
      "Kapal Semi Phinisi AC (Maks 6 Orang per Grup)",
      "Makan 7x Selama di Kapal (Koki onboard)",
      "Peralatan Snorkeling & Life Jacket",
      "Tiket Masuk TN Komodo & Ranger",
      "Dokumentasi Drone & Underwater GoPro",
    ],
    exclusions: ["Tiket Pesawat ke Labuan Bajo", "Tipping Ranger & Kru Kapal"],
    highlights: ["Trekking Pulau Padar Sunrise", "Berenang di Pink Beach", "Snorkeling di Manta Point"],
    itinerary: [
      {
        day: 1,
        title: "Kelor Island, Manjarite & Sunset Kalong",
        description: "Penjemputan di Bandara Komodo, berlayar ke Pulau Kelor untuk trekking dan snorkeling di Manjarite.",
        activities: ["10:00 - Penjemputan di Labuan Bajo", "12:00 - Lunch di Kapal", "17:30 - Sunset Kelelawar Kalong"],
      },
      {
        day: 2,
        title: "Padar Trekking & Pink Beach",
        description: "Summit attack Pulau Padar untuk pemandangan 3 teluk, santai di Pink Beach, dan snorkeling.",
        activities: ["05:00 - Trekking Padar", "09:30 - Pink Beach", "14:00 - Komodo Dragon Trekking di Loh Liang"],
      },
      {
        day: 3,
        title: "Taka Makassar & Manta Point Snorkel",
        description: "Snorkeling di pulau pasir timbul Taka Makassar dan mencari Manta Ray sebelum kembali ke Labuan Bajo.",
        activities: ["07:00 - Taka Makassar", "09:30 - Manta Point", "13:00 - Drop ke Bandara Labuan Bajo"],
      },
    ],
    rating: 4.95,
    totalReviews: 312,
    isPopular: true,
    meetingPoint: "Bandara Komodo (LBJ) / Hotel Labuan Bajo",
    maxGroupCapacity: 6,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-08-25T00:00:00Z",
  },
  {
    id: "dest-03",
    title: "Bali Nusa Penida & Hidden Waterfalls Shared Escape",
    slug: "bali-nusa-penida-hidden-waterfalls",
    tagline: "Liburan hemat keliling Nusa Penida dan air terjun rahasia Bali utara",
    description:
      "Gabung dengan traveler seru untuk mengunjungi Kelingking Beach, Broken Beach, Angel's Billabong, dan air terjun Sekumpul dalam trip berbagi mobil Toyota HiAce 6-seater.",
    location: "Bali & Nusa Penida",
    durationDays: 3,
    durationNights: 2,
    pricePerPax: 1450000,
    coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80",
    galleryImages: [
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80",
    ],
    inclusions: [
      "Tiket Speedboat PP Sanur - Nusa Penida",
      "Mobil Toyota HiAce AC + Driver Lokal",
      "Akomodasi Hotel 2 Malam (Twin Sharing)",
      "Tiket Masuk Semua Wisata",
      "Dokumentasi DSLR",
    ],
    exclusions: ["Makan malam", "Pengeluaran pribadi"],
    highlights: ["T-Rex Cliff Kelingking Beach", "Berenang di Natural Pool Angel's Billabong", "Sekumpul Waterfall Trek"],
    itinerary: [
      {
        day: 1,
        title: "Penida West Island Explorer",
        description: "Berangkat dari Pantai Sanur menuju Nusa Penida bagian barat.",
        activities: ["07:30 - Speedboat Sanur", "09:00 - Kelingking Beach", "13:00 - Broken Beach & Angel's Billabong"],
      },
      {
        day: 2,
        title: "Penida East Island & Diamond Beach",
        description: "Eksplorasi Rumah Pohon Molenteng, Raja Lima, dan Diamond Beach.",
        activities: ["08:00 - Diamond Beach", "11:00 - Rumah Pohon", "16:00 - Kembali ke Sanur Bali"],
      },
      {
        day: 3,
        title: "Sekumpul Secret Waterfall Tour",
        description: "Menuju Bali Utara untuk trekking air terjun Sekumpul & Danau Beratan.",
        activities: ["08:30 - Sekumpul Trek", "13:00 - Danau Beratan Bedugul", "17:00 - Drop Bandara Ngurah Rai"],
      },
    ],
    rating: 4.88,
    totalReviews: 185,
    isPopular: true,
    meetingPoint: "Pantai Sanur / Bandara I Gusti Ngurah Rai",
    maxGroupCapacity: 6,
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-08-26T00:00:00Z",
  },
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: "trip-01",
    destinationId: "dest-01",
    destination: MOCK_DESTINATIONS[0],
    departureDate: "2026-09-12T23:00:00Z",
    returnDate: "2026-09-14T12:00:00Z",
    pricePerPax: 850000,
    maxGroups: 3,
    status: "scheduled",
    groups: [],
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-30T00:00:00Z",
  },
  {
    id: "trip-02",
    destinationId: "dest-02",
    destination: MOCK_DESTINATIONS[1],
    departureDate: "2026-09-18T10:00:00Z",
    returnDate: "2026-09-20T14:00:00Z",
    pricePerPax: 2650000,
    maxGroups: 2,
    status: "scheduled",
    groups: [],
    createdAt: "2026-08-10T00:00:00Z",
    updatedAt: "2026-08-30T00:00:00Z",
  },
  {
    id: "trip-03",
    destinationId: "dest-03",
    destination: MOCK_DESTINATIONS[2],
    departureDate: "2026-09-25T07:30:00Z",
    returnDate: "2026-09-27T17:00:00Z",
    pricePerPax: 1450000,
    maxGroups: 2,
    status: "scheduled",
    groups: [],
    createdAt: "2026-08-20T00:00:00Z",
    updatedAt: "2026-08-30T00:00:00Z",
  },
  {
    id: "trip-04",
    destinationId: "dest-01",
    destination: MOCK_DESTINATIONS[0],
    departureDate: "2026-09-26T23:00:00Z",
    returnDate: "2026-09-28T12:00:00Z",
    pricePerPax: 850000,
    maxGroups: 2,
    status: "scheduled",
    groups: [],
    createdAt: "2026-08-28T00:00:00Z",
    updatedAt: "2026-08-30T00:00:00Z",
  },
];

export const MOCK_PARTICIPANTS: Participant[] = [];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art-01",
    title: "Panduan Lengkap Trip Sharing: Cara Hemat Traveling Tanpa Ribet",
    slug: "panduan-lengkap-trip-sharing",
    excerpt: "Kenapa harus sewa mobil sendiri jika bisa berbagi kursi dengan traveler sehobi? Simak tips cerdas trip sharing di Indonesia.",
    content: `
      ## Mengapa Memilih Trip Sharing?
      Traveling kini tidak lagi harus mahal atau rumit. Konsep **trip sharing** (berbagi perjalanan) memungkinkan traveler solo maupun kelompok kecil untuk menyewa armada bersama maksimal 6 orang per mobil.

      ### Keuntungan Utama:
      1. **Hemat Biaya Hingga 60%**: Biaya sewa kendaraan, bensin, dan pemandu lokal dibagi rata secara transparan.
      2. **Koneksi Baru**: Bertemu sesama penjelajah alam dari berbagai kota dan mancanegara.
      3. **Pemberangkatan Pasti**: Dengan sistem auto-grouping cerdas, kursi Anda otomatis masuk ke grup aktif yang siap berangkat.
    `,
    coverImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80",
    category: "Travel Tips",
    author: {
      name: "Andi Wijaya",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
      role: "Travel Journalist",
    },
    readTimeMinutes: 4,
    publishedAt: "2026-08-28T08:00:00Z",
    views: 1420,
    isFeatured: true,
    tags: ["Trip Sharing", "Budget Travel", "Tips Wisata", "Indonesia"],
  },
  {
    id: "art-02",
    title: "10 Perlengkapan Wajib untuk Sunrise Safari di Kawah Bromo",
    slug: "perlengkapan-wajib-sunrise-bromo",
    excerpt: "Suhu di Bromo bisa mencapai 5°C di pagi hari. Pastikan jaket thermal dan kamera Anda sudah siap dengan checklist ini.",
    content: `
      ## Checklist Sebelum Berangkat ke Bromo:
      Suhu di puncak Penanjakan menjelang fajar sangat dingin. Jangan sampai momen matahari terbit terganggu karena kedinginan.
      
      - Jaket Windbreaker tebal
      - Sarung tangan & kupluk wol
      - Sepatu trekking anti-selip untuk mendaki tangga kawah
      - Masker penutup debu pasir
    `,
    coverImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    category: "Destinations",
    author: {
      name: "Citra Lestari",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      role: "Adventure Specialist",
    },
    readTimeMinutes: 3,
    publishedAt: "2026-08-25T11:30:00Z",
    views: 980,
    isFeatured: false,
    tags: ["Bromo", "Gunung", "Packing List"],
  },
];

export const MOCK_ADMIN_METRICS: AdminMetrics = {
  totalRevenue: 84650000,
  revenueGrowthPercentage: 18.4,
  activeTripsCount: 14,
  averageOccupancyRate: 83.3, // e.g. 5/6 average
  totalParticipants: 84,
  totalBookings: 78,
  availableSeats: 16,
  pendingPaymentsCount: 6,
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: "log-01",
    adminEmail: "admin@sharingtouryogyakarta.com",
    action: "MOVE_PARTICIPANT",
    targetResource: "BookingGroup",
    targetId: "grp-02",
    details: "Memindahkan peserta Elena Jenkins (TRV-8921) dari Grup 1 ke Grup 2.",
    ipAddress: "180.252.164.12",
    createdAt: "2026-09-02T12:00:00.000Z",
  },
  {
    id: "log-02",
    adminEmail: "admin@sharingtouryogyakarta.com",
    action: "CREATE_DESTINATION",
    targetResource: "Destination",
    targetId: "dest-01",
    details: "Membuat paket destinasi Bromo Sunrise & Midnight Safari.",
    ipAddress: "180.252.164.12",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
];

