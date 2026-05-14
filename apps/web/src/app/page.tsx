"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Terminal, Cpu, HardDrive, Play, Square, ExternalLink, Trash2, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface Workspace {
  id: string;
  name: string;
  status: string;
  url: string | null;
  image: string;
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [execModalOpen, setExecModalOpen] = useState(false);
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

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName) return;

    const toastId = toast.loading("Launching workspace...");
    
    try {
      await api.post(`/api/workspaces`, { name: newName });
      toast.success("Workspace ready!", { id: toastId });
      setNewName("");
      fetchWorkspaces();
    } catch (error) {
      toast.error("Deployment failed", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("Stopping workspace...");
    try {
      await api.delete(`/api/workspaces/${id}`);
      toast.success("Workspace stopped", { id: toastId });
      fetchWorkspaces();
    } catch (error) {
      toast.error("Failed to stop workspace", { id: toastId });
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
    <main className="min-h-screen bg-[#030303] text-white p-8">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' }}} />
      
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <Sparkles className="text-primary w-8 h-8" />
              Kairo
            </h1>
            <p className="text-zinc-500 font-medium">Next-gen AI cloud environments</p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-4 py-2 glass rounded-lg flex items-center gap-2 text-sm text-zinc-400">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Runtime Control Active
            </div>
          </div>
        </header>

        {/* Quick Actions / Create */}
        <section className="mb-12">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide"
          >
            {[
              { id: 'node', name: 'Node.js', icon: '⚡' },
              { id: 'python', name: 'Python', icon: '🐍' },
              { id: 'linux', name: 'Ubuntu Desktop', icon: '🖥️' },
              { id: 'rust', name: 'Rust', icon: '🦀' },
            ].map(tpl => (
              <motion.button 
                variants={itemVariants}
                key={tpl.id}
                onClick={() => setNewName(`${tpl.id}-workspace`)}
                className="flex-shrink-0 glass-card !p-3 !px-5 flex items-center gap-3 hover:border-primary/50 transition-all active:scale-95 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{tpl.icon}</span>
                <span className="text-sm font-medium text-zinc-300">{tpl.name}</span>
              </motion.button>
            ))}
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleCreate} 
            className="glass-card flex gap-4 items-center border-primary/10 hover:border-primary/20 transition-all"
          >
            <div className="bg-primary/10 p-2 rounded-lg">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <input 
              type="text" 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="workspace-name (e.g. cloud-ide)"
              className="flex-1 bg-transparent border-none rounded-xl px-2 py-3 focus:outline-none transition-all text-sm font-medium"
            />
            <button 
              type="submit"
              className="bg-primary hover:brightness-110 text-black font-bold px-8 py-3 rounded-xl transition-all flex items-center gap-2 group"
            >
              Initialize
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.form>
        </section>

        {/* Active Workspaces Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
              <HardDrive className="w-5 h-5 text-primary" />
              Active Runtimes
            </h2>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
              Live Control
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
              <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Scanning Docker Socket...</p>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {workspaces.map((ws) => (
                <motion.div 
                  key={ws.id} 
                  variants={itemVariants}
                  className="glass-card group hover:border-primary/40 relative overflow-hidden flex flex-col"
                >
                  <div className="absolute -right-4 -top-4 opacity-0 group-hover:opacity-5 transition-opacity">
                    <Sparkles className="w-24 h-24 text-primary" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-zinc-100 group-hover:text-primary transition-colors">{ws.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${ws.status === 'running' ? 'bg-primary' : 'bg-zinc-600'}`} />
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                        {ws.id.substring(0, 12)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setExecutingId(ws.id); setExecModalOpen(true); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-primary"
                        title="Cloud Terminal"
                      >
                        <Terminal className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(ws.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        title="Stop Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-primary/10 transition-colors">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono mb-1">Compute</div>
                      <div className="text-sm font-semibold text-zinc-300">0.5 vCPU</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-primary/10 transition-colors">
                      <div className="text-[9px] text-zinc-500 uppercase font-mono mb-1">Memory</div>
                      <div className="text-sm font-semibold text-zinc-300">1024 MB</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                      <Cpu className="w-3.5 h-3.5" />
                      Runtime
                    </div>
                    {ws.url && (
                      <a 
                        href={ws.url} 
                        target="_blank" 
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:brightness-110 transition-all bg-primary/10 px-4 py-2 rounded-lg border border-primary/20"
                      >
                        Connect
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      {/* Terminal Modal */}
      <AnimatePresence>
        {execModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card !p-0 overflow-hidden border-primary/20"
            >
              <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <Terminal className="w-4 h-4" />
                  Cloud Exec Instance
                </div>
                <button onClick={() => setExecModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-black/60 rounded-xl p-4 font-mono text-sm h-64 overflow-y-auto mb-4 border border-white/5 text-zinc-300">
                  {lastOutput ? (
                    <pre className="whitespace-pre-wrap">{lastOutput}</pre>
                  ) : (
                    <div className="text-zinc-600 italic">Ready for command input...</div>
                  )}
                </div>

                <form onSubmit={handleExec} className="flex gap-2">
                  <input 
                    type="text" 
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="e.g. ls -la /home/coder/project"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-sm"
                  />
                  <button 
                    disabled={isExecLoading}
                    className="bg-primary hover:brightness-110 text-black font-bold px-6 rounded-xl transition-all disabled:opacity-50"
                  >
                    {isExecLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Run'}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
