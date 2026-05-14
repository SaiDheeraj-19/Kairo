"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Terminal, Cpu, HardDrive, Play, Square, ExternalLink, Trash2, Loader2, Sparkles } from "lucide-react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Workspace {
  id: string;
  name: string;
  status: string;
  port?: number;
  url?: string;
  image: string;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchWorkspaces = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/workspaces`);
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
      toast.error("Failed to connect to orchestrator");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
    const interval = setInterval(fetchWorkspaces, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    setIsCreating(true);
    const toastId = toast.loading("Launching workspace...");
    
    try {
      await axios.post(`${API_URL}/api/workspaces`, { name: newName });
      toast.success("Workspace ready!", { id: toastId });
      setNewName("");
      fetchWorkspaces();
    } catch (error) {
      toast.error("Launch failed", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Stopping workspace...");
    try {
      await axios.delete(`${API_URL}/api/workspaces/${id}`);
      toast.success("Workspace stopped", { id: toastId });
      fetchWorkspaces();
    } catch (error) {
      toast.error("Stop failed", { id: toastId });
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white p-8">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' }}} />
      
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Sparkles className="text-cyan-400 w-8 h-8" />
              Kairo
            </h1>
            <p className="text-zinc-500 font-medium">Next-gen AI cloud environments</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 glass rounded-lg flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Orchestrator Online
            </div>
          </div>
        </header>

        {/* Quick Actions / Create */}
        <section className="mb-12">
          <form onSubmit={handleCreate} className="glass-card flex gap-4 items-center">
            <div className="flex-1 relative">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name your workspace (e.g. frontend-dev)"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            <button 
              disabled={isCreating || !newName}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-8 py-4 rounded-xl transition-all flex items-center gap-2"
            >
              {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
              Launch
            </button>
          </form>
        </section>

        {/* Workspaces Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-zinc-300">Active Workspaces</h2>
            <span className="text-sm text-zinc-500">{workspaces.length} total</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-cyan-500 w-10 h-10" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {workspaces.map((ws) => (
                  <motion.div 
                    key={ws.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <Terminal className="text-cyan-400 w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDelete(ws.id)}
                          className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold mb-1 truncate">{ws.name}</h3>
                    <p className="text-zinc-500 text-sm mb-6 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Running on port {ws.port}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> CPU
                        </p>
                        <p className="text-sm font-mono">0.5 Core</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1 flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> RAM
                        </p>
                        <p className="text-sm font-mono">512 MB</p>
                      </div>
                    </div>

                    <a 
                      href={ws.url} 
                      target="_blank"
                      className="w-full flex items-center justify-center gap-2 bg-white/5 group-hover:bg-cyan-500 group-hover:text-black py-3 rounded-xl font-semibold transition-all"
                    >
                      Open IDE
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>

              {workspaces.length === 0 && (
                <div className="col-span-full py-20 text-center glass-card border-dashed">
                  <p className="text-zinc-500 mb-4">No active workspaces. Ready to build something great?</p>
                  <button 
                    onClick={() => document.querySelector('input')?.focus()}
                    className="text-cyan-400 hover:underline flex items-center gap-2 mx-auto"
                  >
                    Launch your first workspace <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
