import { MessageCircle } from "lucide-react";

export function FloatingWA() {
  return (
    <a
      href="https://wa.me/6288975958005"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp CetakIde"
      className="wa-pulse fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
      <span className="hidden sm:inline">Chat Admin</span>
    </a>
  );
}
