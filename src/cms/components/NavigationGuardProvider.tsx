"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/cms/components/ui/dialog";
import { Button } from "@/cms/components/ui/button";

interface NavigationGuardContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  requestNavigation: (href: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  isDirty: false,
  setIsDirty: () => {},
  requestNavigation: () => {},
});

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingHref = useRef<string | null>(null);

  const requestNavigation = useCallback(
    (href: string) => {
      if (isDirty) {
        pendingHref.current = href;
        setDialogOpen(true);
      } else {
        router.push(href);
      }
    },
    [isDirty, router]
  );

  function handleLeave() {
    setIsDirty(false);
    setDialogOpen(false);
    if (pendingHref.current) {
      router.push(pendingHref.current);
      pendingHref.current = null;
    }
  }

  return (
    <NavigationGuardContext.Provider value={{ isDirty, setIsDirty, requestNavigation }}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, your changes will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Stay
            </Button>
            <Button variant="destructive" onClick={handleLeave}>
              Leave anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NavigationGuardContext.Provider>
  );
}
