import { useLocation } from "wouter";

interface FooterProps {
  darkMode?: boolean;
}

export default function Footer({ darkMode = false }: FooterProps) {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-darkgray border-t border-gray-800 z-10">
      <div className="flex justify-around">
        <button 
          onClick={() => setLocation("/")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/" ? "text-primary" : "text-lightgray"}`}
        >
          <i className={`${location === "/" ? "ri-archive-fill" : "ri-archive-line"} text-xl`}></i>
          <span className="text-xs mt-1">Vault</span>
        </button>
        <button 
          onClick={() => setLocation("/upload")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/upload" ? "text-primary" : "text-lightgray"}`}
        >
          <i className={`${location === "/upload" ? "ri-upload-2-fill" : "ri-upload-2-line"} text-xl`}></i>
          <span className="text-xs mt-1">Upload</span>
        </button>
        <button 
          onClick={() => setLocation("/profile")}
          className={`flex flex-col items-center py-3 px-5 ${location === "/profile" ? "text-primary" : "text-lightgray"}`}
        >
          <i className={`${location === "/profile" ? "ri-user-fill" : "ri-user-line"} text-xl`}></i>
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}
