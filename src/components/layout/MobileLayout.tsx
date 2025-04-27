import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { SyncIndicator } from "@/components/ui/sync-indicator";

interface MobileLayoutProps {
  title: string;
  children: ReactNode;
  showBack?: boolean;
  showSync?: boolean;
  onBack?: () => void;
}

const MobileLayout = ({
  title,
  children,
  showBack = false,
  showSync = true,
  onBack,
}: MobileLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-light bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&blur=50')] bg-fixed bg-cover bg-center bg-blend-screen">
      <header className="sticky top-0 z-10 bg-primary/95 backdrop-blur-sm text-white p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {showBack && (
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-xl font-semibold truncate">{title}</h1>
          </div>
          {showSync && <SyncIndicator />}
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto container max-w-lg mx-auto">
        <div className="space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MobileLayout;
