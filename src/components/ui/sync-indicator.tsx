import React from "react";
import { useSync } from "@/context/SyncContext";
import { Button } from "./button";
import { Loader2, CloudOff, Check, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { isOnline, isSyncing, queuedItems, syncNow, lastSynced } = useSync();

  // Format last synced time
  const formatLastSynced = () => {
    if (!lastSynced) return "Never synced";
    
    const now = new Date();
    const diff = now.getTime() - lastSynced.getTime();
    
    // If less than a minute ago
    if (diff < 60000) {
      return "Just now";
    }
    
    // If less than an hour ago
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }
    
    // If less than a day ago
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }
    
    // Otherwise, show the date
    return lastSynced.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {/* Status indicator */}
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : !isOnline ? (
                <CloudOff className="h-4 w-4 text-red-500" />
              ) : (
                <Check className="h-4 w-4 text-green-500" />
              )}
              
              {/* Queue badge */}
              {queuedItems > 0 && (
                <Badge 
                  variant="destructive" 
                  className="ml-2 px-1.5 py-0 text-xs"
                >
                  {queuedItems}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-col gap-1 p-2">
            <div className="text-sm font-medium">
              {isSyncing 
                ? "Syncing..." 
                : !isOnline 
                  ? "Offline" 
                  : queuedItems > 0 
                    ? "Pending sync" 
                    : "Synced"
              }
            </div>
            <div className="text-xs text-muted-foreground">{formatLastSynced()}</div>
            {queuedItems > 0 && (
              <div className="text-xs text-muted-foreground">
                {queuedItems} {queuedItems === 1 ? "item" : "items"} queued
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Sync button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn(
          "h-8 w-8",
          (!isOnline || isSyncing) && "opacity-50 cursor-not-allowed"
        )}
        disabled={!isOnline || isSyncing}
        onClick={() => syncNow()}
      >
        <RefreshCw className={cn(
          "h-4 w-4", 
          isSyncing && "animate-spin"
        )} />
      </Button>
    </div>
  );
} 