// --- frontend/src/components/Header.tsx ---
import { Trash2 } from "lucide-react";
import { resetDatabase } from "../services/api";

type Props = {
  dark: boolean;
  toggle: () => void;
};

export default function Header({ dark, toggle }: Props) {
  
  const handleReset = async () => {
    if (confirm("⚠️ ARE YOU SURE? \n\nThis will delete ALL posts, comments, and reactions permanently.")) {
      try {
        await resetDatabase();
        // Reload page to clear local state and fetch empty lists
        window.location.reload();
      } catch (error) {
        alert("Failed to reset database");
        console.error(error);
      }
    }
  };

  return (
    <header className="flex justify-between items-center px-6 py-3 border-b border-white/10 bg-card z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          📡
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">Social Signal</h1>
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider">Synthetic Intel Feed</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        
        {/* RESET BUTTON */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold border border-red-500/20"
          title="Reset Database"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Reset DB</span>
        </button>

        <div className="h-6 w-[1px] bg-white/10 mx-1"></div>

        <button
          onClick={toggle}
          className="h-9 w-9 rounded-full bg-bg hover:bg-white/5 border border-white/5 flex items-center justify-center transition-colors text-lg"
          title="Toggle Theme"
        >
          {dark ? "🌙" : "☀️"}
        </button>
      </div>
    </header>
  );
}