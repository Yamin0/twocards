import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <p className="text-8xl font-extrabold text-white/[0.06] font-[family-name:var(--font-manrope)] mb-2 select-none">
          404
        </p>
        <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-10 -mt-10">
          <h1 className="text-xl font-bold text-white font-[family-name:var(--font-manrope)] mb-2">
            Page introuvable
          </h1>
          <p className="text-sm text-white/40 font-[family-name:var(--font-inter)] mb-8">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.3)] font-[family-name:var(--font-manrope)]"
          >
            <Home size={16} strokeWidth={1.5} />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
