// --- frontend/src/components/Sidebar.tsx ---
import { Channel } from "../types";
import { Hash, Plus, ChevronLeft, ChevronRight, Menu } from "lucide-react";

type Props = {
  isOpen: boolean;
  toggle: () => void;
  channels: Channel[];
  activeChannel: Channel;
  onSelect: (c: Channel) => void;
  onCreate: () => void;
};

export default function Sidebar({
  isOpen,
  toggle,
  channels,
  activeChannel,
  onSelect,
  onCreate,
}: Props) {
  return (
    <aside
      className={`
        bg-card border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? "w-64" : "w-16 items-center"}
      `}
    >
      {/* Header / Toggle */}
      <div className={`flex items-center p-4 ${isOpen ? "justify-between" : "justify-center"}`}>
        {isOpen && (
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
                Channels
            </h2>
        )}
        <button
          onClick={toggle}
          className="text-muted hover:text-text p-1 rounded-md hover:bg-white/5 transition"
        >
          {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto w-full px-2 space-y-1">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelect(channel)}
            title={channel.name}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
              ${
                activeChannel.id === channel.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-text"
              }
              ${!isOpen && "justify-center px-0"}
            `}
          >
            <Hash size={18} className="shrink-0" />
            {isOpen && <span className="truncate">{channel.name}</span>}
          </button>
        ))}
      </div>

      {/* Create Button */}
      <div className="p-3 mt-auto border-t border-white/5">
        <button
          onClick={onCreate}
          className={`
            w-full flex items-center gap-2 py-2 rounded-lg text-sm
            bg-white/5 text-text hover:bg-white/10 transition-colors
            ${isOpen ? "px-4" : "justify-center px-0"}
          `}
          title="Create Channel"
        >
          <Plus size={18} />
          {isOpen && <span>New Channel</span>}
        </button>
      </div>
    </aside>
  );
}