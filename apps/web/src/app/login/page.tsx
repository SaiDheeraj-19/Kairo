"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Login() {
  const [email, setEmail] = useState("admin@kairo.dev");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      Cookies.set("kairo-token", data.token, { expires: 7 });
      toast.success("Welcome back to Kairo");
      router.push("/");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' }}} />
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-3 bg-cyan-500/10 rounded-2xl mb-4">
            <Sparkles className="text-cyan-400 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Initialize Session</h1>
          <p className="text-zinc-500 font-medium">Access your cloud workspace environment</p>
        </div>

        <form onSubmit={handleLogin} className="glass-card space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Identifier</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Keyphrase</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Authenticate
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-zinc-600">
          © 2026 Kairo. Protected by isolated runtime.
        </p>
      </motion.div>
    </main>
  );
}
