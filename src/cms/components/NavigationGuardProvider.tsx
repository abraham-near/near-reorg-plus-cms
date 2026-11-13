"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  /** Bumped when "New post" is chosen while already on /admin/posts/new: the editor keys on it to start blank. */
  newPostRun: number;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  isDirty: false,
  setIsDirty: () => {},
  requestNavigation: () => {},
  newPostRun: 0,
});

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}

export function NavigationGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDirty, setIsDirty] = useState(false);
  const [newPostRun, setNewPostRun] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingHref = useRef<string | null>(null);

  // Next keeps a page's state when you navigate to the URL you are already on, so "New post" on
  // /admin/posts/new would keep the post you were writing: start a fresh editor instead.
  const go = useCallback(
    (href: string) => {
      if (href === "/admin/posts/new" && pathname === href) setNewPostRun((run) => run + 1);
      else router.push(href);
    },
    [pathname, router]
  );

  const requestNavigation = useCallback(
    (href: string) => {
      if (isDirty) {
        pendingHref.current = href;
        setDialogOpen(true);
      } else {
        go(href);
      }
    },
    [isDirty, go]
  );

  function handleLeave() {
    setIsDirty(false);
    setDialogOpen(false);
    if (pendingHref.current) {
      go(pendingHref.current);
      pendingHref.current = null;
    }
  }

  return (
    <NavigationGuardContext.Provider value={{ isDirty, setIsDirty, requestNavigation, newPostRun }}>
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
