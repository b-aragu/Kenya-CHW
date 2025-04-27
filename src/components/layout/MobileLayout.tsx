
import { ReactNode } from "react";
import { SyncStatus } from "@/components/ui/sync-status";

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
    <div className="flex flex-col min-h-screen bg-neutral-light">
      <header className="sticky top-0 z-10 bg-primary text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showBack && (
              <button 
                onClick={onBack} 
                className="mr-2 p-1"
                aria-label="Go back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
            )}
            <h1 className="text-xl font-semibold truncate">{title}</h1>
          </div>
          {showSync && <SyncStatus />}
        </div>
      </header>

      <main className="flex-1 p-4 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;
