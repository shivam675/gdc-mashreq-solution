import { Channel } from "../types";

type Props = {
  channel: Channel;
  active: boolean;
  onSelect: (c: Channel) => void;
};

export default function ChannelItem({ channel, active, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(channel)}
      className={`
        w-full text-left px-3 py-2 rounded-lg text-sm transition
        flex items-center gap-2
        ${
          active
            ? "bg-accent/20 text-accent"
            : "hover:bg-white/5 text-text"
        }
      `}
    >
      <span className="text-muted">#</span>
      <span className="truncate">{channel.name}</span>

      {/* Future-ready: unread / alert badge */}
      {/* <span className="ml-auto text-xs bg-red-500 text-white px-2 rounded-full">2</span> */}
    </button>
  );
}
