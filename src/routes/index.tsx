function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState("ID");

  const links = [
    { name: "Beranda", href: "#" },
    { name: "Contoh Visual", href: "#showcase" },
    { name: "Galeri", href: "#galeri" },
    { name: "Logo AI", href: "#logo" },
    { name: "Keunggulan", href: "#keunggulan" },
    { name: "Cara Kerja", href: "#cara-kerja" },
    { name: "FAQ", href: "#faq" },
    { name: "Harga", href: "#harga" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#050505]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Brand */}
        <div className="text-xl font-bold tracking-tight">Garata</div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <a key={l.name} href={l.href} className="text-sm text-white/70 hover:text-white transition">{l.name}</a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <button className="text-sm text-white/70 hover:text-white">Masuk</button>
          <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="px-2 py-1 text-xs font-bold border border-white/20 rounded">
            {lang}
          </button>
          <Link to="/auth" search={{ mode: "register" }} className="px-5 py-2 text-sm font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>
            Mulai Gratis
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <button onClick={() => setLang(lang === "ID" ? "EN" : "ID")} className="text-xs font-bold">{lang}</button>
          <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X /> : <Menu />}</button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full w-full border-b border-white/10 bg-[#050505] p-6 lg:hidden flex flex-col gap-4">
          {links.map((l) => (
            <a key={l.name} href={l.href} onClick={() => setIsOpen(false)} className="text-lg font-medium">{l.name}</a>
          ))}
          <hr className="border-white/10" />
          <button className="text-left">Masuk</button>
          <Link to="/auth" search={{ mode: "register" }} className="w-full py-3 text-center font-semibold text-black rounded-full" style={{ background: BRAND.gold }}>
            Mulai Gratis
          </Link>
        </div>
      )}
    </nav>
  );
}
