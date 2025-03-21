import { formatDate, formatDuration } from "@/lib/utils";
import { Track } from "@shared/schema";

interface TrackItemProps {
  track: Track;
  index: number;
  isPlaying?: boolean;
  onPlay: () => void;
}

export default function TrackItem({ track, index, isPlaying = false, onPlay }: TrackItemProps) {
  const createdAt = track.createdAt ? new Date(track.createdAt) : new Date();
  
  return (
    <div 
      className={`${isPlaying ? 'bg-primary/10 hover:bg-primary/20 border border-primary/30' : 'bg-gray-900 hover:bg-gray-800'} p-3 rounded-md flex items-center cursor-pointer`} 
      onClick={onPlay}
    >
      <div className={`mr-3 ${isPlaying ? 'text-primary' : 'text-lightgray'} w-8 text-center`}>
        {isPlaying ? (
          <i className="ri-play-fill text-lg"></i>
        ) : (
          index + 1
        )}
      </div>
      <div className="flex-grow">
        <h4 className="text-white font-medium">{track.name}</h4>
        <p className="text-xs text-lightgray">
          {formatDate(createdAt)} · {formatDuration(track.duration)}
        </p>
      </div>
      <button className="p-2 text-lightgray hover:text-white">
        <i className="ri-more-2-fill"></i>
      </button>
    </div>
  );
}
