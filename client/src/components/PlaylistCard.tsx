import { Playlist } from "@shared/schema";

interface PlaylistCardProps {
  playlist: Playlist;
  trackCount: number;
  onClick: () => void;
}

export default function PlaylistCard({ playlist, trackCount, onClick }: PlaylistCardProps) {
  return (
    <div 
      className="bg-gray-900 rounded-md p-4 mb-4 shadow-md hover:bg-gray-800 transition duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div 
          className="w-16 h-16 rounded-md flex items-center justify-center mr-4 flex-shrink-0"
          style={{ backgroundColor: playlist.color }}
        >
          <i className={`${playlist.icon} text-2xl text-white`}></i>
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-white">{playlist.name}</h3>
          <p className="text-sm text-lightgray">{trackCount} recordings</p>
        </div>
        <button className="text-white p-2 hover:bg-gray-700 rounded-full">
          <i className="ri-more-2-fill"></i>
        </button>
      </div>
    </div>
  );
}
