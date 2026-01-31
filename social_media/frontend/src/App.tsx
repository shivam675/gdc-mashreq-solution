// --- frontend/src/App.tsx ---
import { useState } from "react";
import Header from "./components/Header";
import Feed from "./pages/Feed";
import Sidebar from "./components/Sidebar";
import { Channel } from "./types";

const DEFAULT_CHANNELS: Channel[] = [
  { id: "lifestyle", name: "lifestyle" },
  { id: "social", name: "Social" },
  { id: "science", name: "Science" },
  { id: "banking", name: "Banking" },
];

export default function App() {
  const [dark, setDark] = useState(true);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className={dark ? "dark" : ""}>
      <div className="h-screen w-full bg-bg text-text flex flex-col overflow-hidden">
        <Header dark={dark} toggle={() => setDark(!dark)} />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            isOpen={isSidebarOpen}
            toggle={() => setIsSidebarOpen(!isSidebarOpen)}
            channels={channels}
            activeChannel={activeChannel}
            onSelect={setActiveChannel}
            onCreate={() => {
              const name = prompt("Channel name?");
              if (!name) return;
              const ch = { id: name.toLowerCase(), name };
              setChannels([...channels, ch]);
              setActiveChannel(ch);
            }}
          />

          <main className="flex-1 flex flex-col relative w-full h-full">
            <Feed channel={activeChannel} />
          </main>
        </div>
      </div>
    </div>
  );
}