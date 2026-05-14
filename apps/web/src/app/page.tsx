"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Terminal, Cpu, HardDrive, Play, Square, ExternalLink, Trash2, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
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
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [command, setCommand] = useState("");
  const [lastOutput, setLastOutput] = useState("");
  const [isExecLoading, setIsExecLoading] = useState(false);
  const router = useRouter();

  const fetchWorkspaces = async () => {
    try {
      const { data } = await api.get(`/api/workspaces`);
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = Cookies.get("kairo-token");
    if (!token) {
      router.push("/login");
      return;
    }
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
      await api.post(`/api/workspaces`, { name: newName });
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
      await api.delete(`/api/workspaces/${id}`);
      toast.success("Workspace stopped", { id: toastId });
      fetchWorkspaces();
    } catch (error) {
      toast.error("Stop failed", { id: toastId });
    }
  };

  const handleExec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executingId || !command) return;
    
    setIsExecLoading(true);
    try {
      const { data } = await api.post(`/api/workspaces/${executingId}/exec`, { command });
      setLastOutput(data.output);
    } catch (error) {
      toast.error("Command failed");
    } finally {
      setIsExecLoading(false);
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
          <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'node', name: 'Node.js', icon: '⚡' },
              { id: 'python', name: 'Python', icon: '🐍' },
              { id: 'linux', name: 'Ubuntu Desktop', icon: '🖥️' },
              { id: 'rust', name: 'Rust', icon: '🦀' },
            ].map(tpl => (
              <button 
                key={tpl.id}
                onClick={() => setNewName(`${tpl.id}-workspace`)}
                className="flex-shrink-0 glass-card !p-3 !px-5 flex items-center gap-3 hover:border-cyan-500/50 transition-all active:scale-95"
              >
                <span className="text-xl">{tpl.icon}</span>
                <span className="text-sm font-medium text-zinc-300">{tpl.name}</span>
              </button>
            ))}
          </div>

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
              <AnimatePresence mode="popLayout">
                {workspaces.map((ws) => (
                  <motion.div 
                    key={ws.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
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

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <a 
                        href={ws.url} 
                        target="_blank"
                        className="flex items-center justify-center gap-2 bg-white/5 group-hover:bg-cyan-500 group-hover:text-black py-3 rounded-xl font-semibold transition-all"
                      >
                        Open IDE
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => {
                          setExecutingId(ws.id);
                          setLastOutput("");
                          setCommand("");
                        }}
                        className="flex items-center justify-center gap-2 bg-white/5 hover:bg-zinc-800 py-3 rounded-xl font-semibold transition-all"
                      >
                        Terminal
                        <Terminal className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {workspaces.length === 0 && !loading && (
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

        {/* Exec Modal */}
        <AnimatePresence>
          {executingId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExecutingId(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative glass-card w-full max-w-2xl !p-0 overflow-hidden"
              >
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                  <h3 className="font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    Cloud Terminal
                  </h3>
                  <button onClick={() => setExecutingId(null)} className="text-zinc-500 hover:text-white">✕</button>
                </div>
                
                <div className="p-6">
                  <div className="bg-black rounded-lg p-4 mb-4 h-64 overflow-y-auto font-mono text-sm text-green-400 border border-white/5">
                    {lastOutput ? (
                      <pre className="whitespace-pre-wrap">{lastOutput}</pre>
                    ) : (
                      <p className="text-zinc-600">Enter a command to execute in the workspace...</p>
                    )}
                    {isExecLoading && <Loader2 className="animate-spin mt-2" />}
                  </div>

                  <form onSubmit={handleExec} className="flex gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="e.g. ls -la /home/coder/project"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <button 
                      disabled={isExecLoading || !command}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                    >
                      Run
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
