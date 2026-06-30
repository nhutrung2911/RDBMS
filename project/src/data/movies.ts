export interface Movie {
  id: number;
  title: string;
  titleVi?: string;
  genre: string[];
  duration: number;
  rating: string;
  score: number;
  poster: string;
  backdrop: string;
  trailer?: string;
  status: 'now_showing' | 'coming_soon' | 'ended';
  releaseDate: string;
  description: string;
  director: string;
  cast: string[];
  language: string;
}

export interface Cinema {
  id: number;
  name: string;
  address: string;
  city: string;
}

export interface Showtime {
  id: number;
  movieId: number;
  cinemaId: number;
  date: string;
  time: string;
  hall: string;
  type: 'standard' | '4dx' | 'imax' | 'sweetbox';
  availableSeats: number;
  totalSeats: number;
}

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const day0 = getLocalDateString(0); // Today
const day1 = getLocalDateString(1); // Tomorrow
const day2 = getLocalDateString(2); // Day after

export const movies: Movie[] = [
  {
    id: 1,
    title: "Dune: Part Two",
    titleVi: "Xứ Cát: Phần Hai",
    genre: ["Sci-Fi", "Action", "Adventure"],
    duration: 166,
    rating: "T16",
    score: 8.8,
    poster: "https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/7991486/pexels-photo-7991486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "now_showing",
    releaseDate: getLocalDateString(-10),
    description: "Paul Atreides hợp nhất với người Fremen trong khi theo đuổi con đường trả thù chống lại những kẻ đã phá hủy gia đình anh. Đứng trước sự lựa chọn giữa tình yêu cuộc đời mình và số phận của vũ trụ, anh phải ngăn chặn một tương lai khủng khiếp chỉ có anh mới có thể thấy trước.",
    director: "Denis Villeneuve",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Austin Butler"],
    language: "Phụ đề Tiếng Việt"
  },
  {
    id: 2,
    title: "Godzilla x Kong",
    titleVi: "Godzilla x Kong: Đế Chế Mới",
    genre: ["Action", "Adventure", "Sci-Fi"],
    duration: 115,
    rating: "T13",
    score: 7.2,
    poster: "https://images.pexels.com/photos/3945317/pexels-photo-3945317.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/3945317/pexels-photo-3945317.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "now_showing",
    releaseDate: getLocalDateString(-5),
    description: "Kong và đồng minh mới của mình Godzilla phải liên minh trong một cuộc chiến tàn khốc chống lại một thế lực cổ xưa khổng lồ tiềm ẩn bên trong thế giới của chúng ta.",
    director: "Adam Wingard",
    cast: ["Rebecca Hall", "Brian Tyree Henry", "Dan Stevens", "Kaylee Hottle"],
    language: "Phụ đề Tiếng Việt"
  },
  {
    id: 3,
    title: "Kung Fu Panda 4",
    titleVi: "Kung Fu Panda 4",
    genre: ["Animation", "Action", "Comedy"],
    duration: 94,
    rating: "P",
    score: 6.9,
    poster: "https://images.pexels.com/photos/7234213/pexels-photo-7234213.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/7234213/pexels-photo-7234213.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "now_showing",
    releaseDate: getLocalDateString(-8),
    description: "Chiến binh Rồng Po cần phải đào tạo một chiến binh Rồng mới. Trên con đường này, anh gặp một cáo tên là Zhen, người anh phải đối đầu với một phù thủy mạnh mẽ.",
    director: "Mike Mitchell",
    cast: ["Jack Black", "Awkwafina", "Bryan Cranston", "Viola Davis"],
    language: "Lồng tiếng Tiếng Việt"
  },
  {
    id: 4,
    title: "Civil War",
    titleVi: "Nội Chiến",
    genre: ["Action", "Drama", "Thriller"],
    duration: 109,
    rating: "C18",
    score: 7.5,
    poster: "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "now_showing",
    releaseDate: getLocalDateString(-3),
    description: "Trong một tương lai gần, một nhóm phóng viên chiến trường di chuyển qua nước Mỹ đang bị nội chiến tàn phá để đưa tin trong khi đất nước sụp đổ.",
    director: "Alex Garland",
    cast: ["Kirsten Dunst", "Wagner Moura", "Cailee Spaeny", "Stephen McKinley Henderson"],
    language: "Phụ đề Tiếng Việt"
  },
  {
    id: 5,
    title: "The Fall Guy",
    titleVi: "Người Đóng Thế",
    genre: ["Action", "Comedy", "Romance"],
    duration: 126,
    rating: "T13",
    score: 7.0,
    poster: "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "now_showing",
    releaseDate: getLocalDateString(-1),
    description: "Một người đóng thế chiến trường bị trật bánh trở lại làm việc khi ngôi sao điện ảnh đang làm phim biến mất. Anh phải truy tìm trong khi cố gắng gây ấn tượng với đạo diễn là tình cũ của mình.",
    director: "David Leitch",
    cast: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson", "Hannah Waddingham"],
    language: "Phụ đề Tiếng Việt"
  },
  {
    id: 6,
    title: "Inside Out 2",
    titleVi: "Những Mảnh Ghép Cảm Xúc 2",
    genre: ["Animation", "Comedy", "Drama"],
    duration: 100,
    rating: "P",
    score: 8.1,
    poster: "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/3662845/pexels-photo-3662845.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "coming_soon",
    releaseDate: getLocalDateString(3),
    description: "Riley trải qua những cảm xúc mới khi cô bước vào tuổi teen và gặp phải những cảm xúc hoàn toàn mới xuất hiện trong đầu cô.",
    director: "Kelsey Mann",
    cast: ["Amy Poehler", "Maya Hawke", "Kensington Tallman", "Liza Lapira"],
    language: "Lồng tiếng Tiếng Việt"
  },
  {
    id: 7,
    title: "Deadpool & Wolverine",
    titleVi: "Deadpool & Wolverine",
    genre: ["Action", "Comedy", "Superhero"],
    duration: 127,
    rating: "C18",
    score: 8.4,
    poster: "https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/4009402/pexels-photo-4009402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "coming_soon",
    releaseDate: getLocalDateString(14),
    description: "Deadpool và Wolverine cùng nhau trong một cuộc phiêu lưu xuyên đa vũ trụ, nơi họ phải chiến đấu chống lại những mối đe dọa mới.",
    director: "Shawn Levy",
    cast: ["Ryan Reynolds", "Hugh Jackman", "Emma Corrin", "Matthew Macfadyen"],
    language: "Phụ đề Tiếng Việt"
  },
  {
    id: 8,
    title: "Alien: Romulus",
    titleVi: "Alien: Romulus",
    genre: ["Horror", "Sci-Fi", "Thriller"],
    duration: 119,
    rating: "C18",
    score: 7.3,
    poster: "https://images.pexels.com/photos/8108086/pexels-photo-8108086.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&dpr=1",
    backdrop: "https://images.pexels.com/photos/8108086/pexels-photo-8108086.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    status: "coming_soon",
    releaseDate: getLocalDateString(30),
    description: "Một nhóm thanh niên thực dân không gian, trong khi đang chặn một trạm vũ trụ bị bỏ hoang, đối mặt với dạng sống nguy hiểm nhất trong vũ trụ.",
    director: "Fede Álvarez",
    cast: ["Cailee Spaeny", "David Jonsson", "Archie Renaux", "Isabela Merced"],
    language: "Phụ đề Tiếng Việt"
  }
];

export const cinemas: Cinema[] = [
  { id: 1, name: "CGV Vincom Center", address: "72 Lê Thánh Tôn, Q.1", city: "TP. Hồ Chí Minh" },
  { id: 2, name: "CGV Aeon Mall Tân Phú", address: "30 Bờ Bao Tân Thắng, Q. Tân Phú", city: "TP. Hồ Chí Minh" },
  { id: 3, name: "CGV Landmark 81", address: "208 Nguyễn Hữu Cảnh, Q. Bình Thạnh", city: "TP. Hồ Chí Minh" },
  { id: 4, name: "CGV Vincom Bà Triệu", address: "191 Bà Triệu, Q. Hai Bà Trưng", city: "Hà Nội" },
  { id: 5, name: "CGV Royal City", address: "72A Nguyễn Trãi, Q. Thanh Xuân", city: "Hà Nội" },
  { id: 6, name: "CGV Vincom Đà Nẵng", address: "910A Ngô Quyền, Q. Sơn Trà", city: "Đà Nẵng" },
];

export const showtimes: Showtime[] = [
  { id: 1, movieId: 1, cinemaId: 1, date: day0, time: "09:30", hall: "Hall 1", type: "imax", availableSeats: 45, totalSeats: 120 },
  { id: 2, movieId: 1, cinemaId: 1, date: day0, time: "12:15", hall: "Hall 2", type: "standard", availableSeats: 78, totalSeats: 100 },
  { id: 3, movieId: 1, cinemaId: 1, date: day0, time: "15:00", hall: "Hall 3", type: "4dx", availableSeats: 32, totalSeats: 80 },
  { id: 4, movieId: 1, cinemaId: 1, date: day0, time: "18:30", hall: "Hall 1", type: "imax", availableSeats: 15, totalSeats: 120 },
  { id: 5, movieId: 1, cinemaId: 1, date: day0, time: "21:00", hall: "Hall 2", type: "standard", availableSeats: 60, totalSeats: 100 },
  { id: 6, movieId: 1, cinemaId: 2, date: day1, time: "10:00", hall: "Hall A", type: "standard", availableSeats: 55, totalSeats: 90 },
  { id: 7, movieId: 1, cinemaId: 2, date: day1, time: "14:30", hall: "Hall B", type: "sweetbox", availableSeats: 12, totalSeats: 30 },
  { id: 8, movieId: 1, cinemaId: 2, date: day1, time: "19:45", hall: "Hall A", type: "standard", availableSeats: 40, totalSeats: 90 },
  { id: 9, movieId: 1, cinemaId: 3, date: day2, time: "11:00", hall: "Hall X", type: "imax", availableSeats: 20, totalSeats: 150 },
  { id: 10, movieId: 1, cinemaId: 3, date: day0, time: "16:00", hall: "Hall Y", type: "4dx", availableSeats: 38, totalSeats: 60 },
  { id: 11, movieId: 2, cinemaId: 1, date: day0, time: "10:00", hall: "Hall 2", type: "standard", availableSeats: 70, totalSeats: 100 },
  { id: 12, movieId: 2, cinemaId: 1, date: day1, time: "14:00", hall: "Hall 3", type: "4dx", availableSeats: 25, totalSeats: 80 },
  { id: 13, movieId: 2, cinemaId: 1, date: day2, time: "17:45", hall: "Hall 1", type: "imax", availableSeats: 50, totalSeats: 120 },
  { id: 14, movieId: 3, cinemaId: 2, date: day0, time: "09:00", hall: "Hall A", type: "standard", availableSeats: 80, totalSeats: 90 },
  { id: 15, movieId: 3, cinemaId: 2, date: day1, time: "11:30", hall: "Hall B", type: "standard", availableSeats: 65, totalSeats: 90 },
  { id: 16, movieId: 3, cinemaId: 1, date: day0, time: "15:30", hall: "Hall 2", type: "standard", availableSeats: 88, totalSeats: 100 },
  { id: 17, movieId: 3, cinemaId: 1, date: day1, time: "16:45", hall: "Hall 3", type: "standard", availableSeats: 70, totalSeats: 100 },
  { id: 18, movieId: 4, cinemaId: 4, date: day0, time: "14:00", hall: "Hall I", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 19, movieId: 4, cinemaId: 4, date: day1, time: "16:30", hall: "Hall II", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 20, movieId: 4, cinemaId: 5, date: day0, time: "19:00", hall: "Hall Alpha", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 21, movieId: 4, cinemaId: 6, date: day1, time: "20:00", hall: "Hall Gold", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 22, movieId: 5, cinemaId: 4, date: day0, time: "11:15", hall: "Hall II", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 23, movieId: 5, cinemaId: 5, date: day1, time: "13:30", hall: "Hall Beta", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 24, movieId: 5, cinemaId: 6, date: day0, time: "15:45", hall: "Hall Silver", type: "standard", availableSeats: 120, totalSeats: 120 },
  { id: 25, movieId: 5, cinemaId: 1, date: day2, time: "18:00", hall: "Hall 2", type: "standard", availableSeats: 120, totalSeats: 120 },
];


export const TICKET_PRICES: Record<string, number> = {
  standard: 90000,
  "4dx": 150000,
  imax: 130000,
  sweetbox: 200000,
};

export const SEAT_TYPES = {
  standard: { label: "Thường", color: "bg-slate-600" },
  vip: { label: "VIP", color: "bg-amber-600" },
  couple: { label: "Đôi", color: "bg-rose-700" },
};
