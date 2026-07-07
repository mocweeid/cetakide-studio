export type PromptTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
};

export const PROMPT_CATEGORIES = [
  { key: "all", label: "Semua Kategori" },
  { key: "laundry", label: "Laundry & Cleanings" },
  { key: "kuliner", label: "Kuliner & Cafe" },
  { key: "fashion", label: "Fashion & Style" },
  { key: "jasa", label: "Jasa Profesional" },
  { key: "ecommerce", label: "E-Commerce & Retail" },
  { key: "edukasi", label: "Edukasi & Bisnis" }
];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // --- LAUNDRY & CLEANINGS ---
  {
    id: "laundry-1",
    title: "Laundry Kiloan Kekinian & Bersih",
    category: "laundry",
    description: "Desain poster promo laundry kiloan dengan visual tumpukan pakaian bersih, wangi, rapi, dan mesin cuci modern berlatar pastel pastel cerah.",
    prompt: "Minimalist laundry service poster, fresh clean linen stacks on a wooden table, a sleek modern washing machine in the background, soft warm lighting, soft pastel blue and cream color scheme, clean modern layout, cinematic feel"
  },
  {
    id: "laundry-2",
    title: "Premium Shoes & Bag Cleaning",
    category: "laundry",
    description: "Poster aesthetic untuk layanan cuci sepatu dan tas premium. Menampilkan sepatu sneakers bersih mengkilap dengan uap uap bersih.",
    prompt: "Premium sneaker care and bag spa advertisement, a sparkling clean luxury sneaker floating in mid-air with gentle steam particles, clean reflective surface below, professional studio lighting, dark modern aesthetic background"
  },
  {
    id: "laundry-3",
    title: "Express Laundry - Cepat & Wangi",
    category: "laundry",
    description: "Poster promosi layanan laundry express 3 jam jadi dengan tumpukan baju rapi terlipat, berlatar segar.",
    prompt: "Express laundry service poster, neatly folded ironed clothes smelling fresh with small white floral petals falling, glowing bright background, fresh light green and white color scheme, high quality lifestyle shot"
  },
  {
    id: "laundry-4",
    title: "Layanan Cuci Karpet & Sofa Rumah",
    category: "laundry",
    description: "Desain poster home cleaning, berfokus pada kebersihan karpet dan sofa bebas tungau dan debu.",
    prompt: "Home interior cleaning advertisement, clean soft beige sofa and beautiful patterned carpet looking brand new, sunlight streaming through a window, tiny dust-free sparkles in the air, cozy clean living room scene"
  },
  {
    id: "laundry-5",
    title: "Self-Service Coin Laundry",
    category: "laundry",
    description: "Poster untuk laundromat koin modern gaya retro-chic tempat nongkrong kekinian.",
    prompt: "Modern aesthetic coin laundromat shop interior, row of retro washing machines glowing, warm cozy lighting, a minimalist bench, soft vintage film color grading, clean and welcoming"
  },

  // --- KULINER & CAFE ---
  {
    id: "kuliner-1",
    title: "Kopi Susu Gula Aren Kekinian",
    category: "kuliner",
    description: "Poster kopi susu dingin dengan es batu kristal berembun dan lelehan gula aren yang menggugah selera.",
    prompt: "Close up shot of iced brown sugar milk coffee in a clear aesthetic glass, condensation droplets on glass, splashing milk, espresso swirling, dark rustic wooden table, soft warm lighting, moody atmosphere"
  },
  {
    id: "kuliner-2",
    title: "Roti Bakar & Pastry Aesthetic",
    category: "kuliner",
    description: "Poster bakery berfokus pada croissant hangat berlapis emas mentega dengan secangkir latte pagi hari.",
    prompt: "Warm crispy croissant on a minimalist ceramic plate next to a cup of hot latte coffee with foam art, soft morning sunlight, cozy bakery background, neutral color palette"
  },
  {
    id: "kuliner-3",
    title: "Burger Premium Double Patty",
    category: "kuliner",
    description: "Poster burger jumbo dengan keju meleleh dan sayuran segar, siap saji dan menggiurkan.",
    prompt: "Gourmet double cheeseburger with melting cheddar, fresh lettuce, and ripe tomatoes, floating ingredients, dark studio lighting, dramatic product photography, high-end food advertising"
  },
  {
    id: "kuliner-4",
    title: "Promo Ramen Jepang Gurih",
    category: "kuliner",
    description: "Poster menu ramen dengan kepulan asap hangat, telur setengah matang, dan nori di mangkok keramik tradisional.",
    prompt: "Steaming hot bowl of authentic Japanese ramen, soft-boiled egg, nori seaweed, sliced pork belly, rich broth, cozy dark izakaya restaurant background, moody cinematic lighting"
  },
  {
    id: "kuliner-5",
    title: "Minuman Mocktail Buah Segar",
    category: "kuliner",
    description: "Poster jus buah segar atau mocktail tropis warna-warni yang segar untuk melepas dahaga.",
    prompt: "Vibrant tropical fruit mocktail drink with orange and mint slices, ice cubes splashing, bright sunny beach background, fresh and energetic mood, editorial beverage photography"
  },

  // --- FASHION & STYLE ---
  {
    id: "fashion-1",
    title: "Katalog OOTD Minimalis / Casual",
    category: "fashion",
    description: "Desain katalog/poster busana minimalis dengan model mengenakan pakaian warna earth-tone berlatar studio bersih.",
    prompt: "Minimalist fashion lookbook, modern clothing styled in earth tones, aesthetic studio background, soft natural lighting, high fashion photography, editorial composition"
  },
  {
    id: "fashion-2",
    title: "Promo Sneakers Sneakers Trendy",
    category: "fashion",
    description: "Desain promosi sneakers pria/wanita dengan gaya urban street culture kekinian.",
    prompt: "Urban street fashion shoe advertisement, trendy sneakers standing on wet asphalt with neon light reflections, cyber punk city background, dramatic wide-angle shot"
  },
  {
    id: "fashion-3",
    title: "Hijab & Gamis Anggun Modern",
    category: "fashion",
    description: "Poster koleksi busana muslimah elegan dengan siluet anggun berlatar arsitektur estetik timur tengah.",
    prompt: "Elegant modest fashion photoshoot, model in flowing pastel hijab and dress, soft light pink and gold color palette, arches of modern architecture in background, dreamy sunny lighting"
  },
  {
    id: "fashion-4",
    title: "Retro Vintage Thrifting Thrift Shop",
    category: "fashion",
    description: "Poster promosi toko baju vintage thrift shop dengan gaya retro 90-an yang trendi di kalangan anak muda.",
    prompt: "Retro thrift shop clothing display, denim jackets and vintage shirts hanging on wooden racks, warm grainy film look, 90s aesthetic, neon sign glowing in the corner"
  },
  {
    id: "fashion-5",
    title: "Aksesoris Jam Tangan Mewah",
    category: "fashion",
    description: "Desain poster jam tangan luxury premium berlatar hitam gelap dan bayangan eksklusif.",
    prompt: "Luxury watch product photography, clean metallic watch face reflecting soft studio lights, obsidian stone background, rich gold highlights, dark upscale advertising style"
  },

  // --- JASA PROFESIONAL ---
  {
    id: "jasa-1",
    title: "Barbershop Klasik - Potong Rambut Pria",
    category: "jasa",
    description: "Poster promosi jasa pangkas rambut pria barbershop modern dengan kursi klasik kulit dan cermin retro.",
    prompt: "Classic gentleman barbershop interior, premium leather barber chair, neon sign reflecting on polished mirrors, industrial design walls, vintage grooming tools on table, warm ambient lighting"
  },
  {
    id: "jasa-2",
    title: "Jasa Desain Grafis & Branding Kreatif",
    category: "jasa",
    description: "Poster promo studio kreatif / desain agensi dengan mockup laptop, palet warna berani, dan bentuk 3d abstrak.",
    prompt: "Creative design agency advertisement, modern workspace desk with a high-end laptop, colorful abstract 3d shapes floating, clean dark office background, vibrant purple and cyan lighting"
  },
  {
    id: "jasa-3",
    title: "Studio Foto Wisuda / Prewedding",
    category: "jasa",
    description: "Poster promosi studio fotografi dengan kamera, pencahayaan softbox, dan hasil potret estetik.",
    prompt: "Professional photography studio promo, high-end camera body with large lens, softbox studio lights casting gentle glow, clean studio backdrop, modern camera gear setup"
  },
  {
    id: "jasa-4",
    title: "Jasa Konsultan Bisnis & Keuangan",
    category: "jasa",
    description: "Poster promosi konsultan atau coaching bisnis dengan grafik naik yang positif, dokumen rapi, dan pena mewah.",
    prompt: "Professional business consulting poster, corporate office desk with graphs pointing upwards on tablet, sleek glasses, premium fountain pen, clean corporate navy blue color palette"
  },
  {
    id: "jasa-5",
    title: "Jasa Cuci Mobil & Detailing",
    category: "jasa",
    description: "Poster car wash premium dan coating mobil mengkilap bersih terawat.",
    prompt: "Luxury car wash and detailing service, clean black sedan shining under bright white overhead lights, soap suds slipping down the body, pristine clean look, high tech garage backdrop"
  },

  // --- E-COMMERCE & RETAIL ---
  {
    id: "ecommerce-1",
    title: "Mega Sale 12.12 / Diskon Gajian",
    category: "ecommerce",
    description: "Desain promo belanja besar-besaran 12.12 dengan tumpukan kotak kado bergaya modern minimalis.",
    prompt: "E-commerce shopping event banner, stacks of premium black and gold gift boxes floating, neon glow discount text placeholder, dark background with gold dust falling, luxury retail feel"
  },
  {
    id: "ecommerce-2",
    title: "Skincare Glow Skin Glowing",
    category: "ecommerce",
    description: "Poster serum wajah estetik berlatar tetesan air bersih segar dan kelopak mawar putih.",
    prompt: "Aesthetic skincare serum bottle standing on a wet stone pedestal, splashing clean water drops, green botanical leaves, bright clean morning sunlight, organic cosmetic advertising"
  },
  {
    id: "ecommerce-3",
    title: "Promo Gadget / Smartphone Terbaru",
    category: "ecommerce",
    description: "Poster rilis handphone baru berlatar futuristik neon dan pola sirkuit abstrak yang elegan.",
    prompt: "Futuristic smartphone release advertisement, sleek phone chassis with glowing edge screens, dark circuit board background, neon cyan and red lasers, high tech tech promo"
  },
  {
    id: "ecommerce-4",
    title: "Diskon Perabotan Rumah Tangga",
    category: "ecommerce",
    description: "Poster katalog perabot modern seperti meja makan kayu, vas bunga kering, dan lampu gantung estetik.",
    prompt: "Modern home furniture advertisement, scandinavian style dining table, dry pampas grass in ceramic vase, minimalist pendant lamp, bright beige wall background, warm interior design"
  },
  {
    id: "ecommerce-5",
    title: "Buku & Alat Tulis Minimalis",
    category: "ecommerce",
    description: "Poster stationery estetik untuk anak sekolah / pekerja dengan notebook kulit dan pena estetik.",
    prompt: "Minimalist stationery flatlay, open blank notebook with clean pages, brass pen, wooden paper clips, aesthetic workspace, neutral muted colors, soft aesthetic"
  },

  // --- EDUKASI & BISNIS ---
  {
    id: "edukasi-1",
    title: "Kelas / Webinar Online Bisnis",
    category: "edukasi",
    description: "Desain promo kelas digital bisnis online dengan mockup smartphone dan grafik pertumbuhan laba.",
    prompt: "Digital marketing online webinar poster, smartphone displaying e-learning website, colorful graphs emerging from the screen, dark modern workspace background with blue glow"
  },
  {
    id: "edukasi-2",
    title: "Bimbingan Belajar Anak Pintar",
    category: "edukasi",
    description: "Poster bimbel ceria anak sekolah dengan ikon-ikon sains, globe, dan warna-warni menyenangkan.",
    prompt: "Fun kids education and tutoring poster, cute colorful illustrations of planets, mathematical symbols, open books, happy bright color scheme, clean whiteboard background"
  },
  {
    id: "edukasi-3",
    title: "Kursus Bahasa Inggris / Asing",
    category: "edukasi",
    description: "Poster promosi kursus bahasa asing dengan landmark terkenal seperti Big Ben atau Menara Eiffel dengan gaya vektor datar modern.",
    prompt: "Modern language learning course poster, clean vector illustrations of London Big Ben and Paris Eiffel tower, open passport, airplane trail, flat design graphic art"
  }
];
