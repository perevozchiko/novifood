'use client';

/*
  Shared PWA update state. Registers the service worker once and exposes the
  update lifecycle to the auto-banner and the Settings screen.

  Re-checks for a new build when the app returns to the foreground — important
  for installed iOS PWAs that resume from memory instead of reloading.
*/

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1h

type PwaUpdateCtx = {
  /** Whether service workers are supported in this browser. */
  supported: boolean;
  /** A new build is downloaded and waiting to be applied. */
  needRefresh: boolean;
  /** A manual update check is in flight. */
  checking: boolean;
  /** Human-readable build label (version + git hash). */
  version: string;
  /** Reload into the new build. */
  applyUpdate: () => void;
  /** Hide the update banner without applying. */
  dismiss: () => void;
  /** Ask the browser to re-fetch the service worker now. */
  checkForUpdate: () => Promise<void>;
};

const Ctx = createContext<PwaUpdateCtx | null>(null);

function buildVersionLabel(): string {
  const ver = process.env.NEXT_PUBLIC_APP_VERSION ?? '0';
  const hash = process.env.NEXT_PUBLIC_GIT_HASH ?? 'dev';
  return `v${ver} (${hash})`;
}

export function PwaUpdateProvider({ children }: { children: ReactNode }) {
  const regRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const [supported, setSupported] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [checking, setChecking] = useState(false);
  const version = buildVersionLabel();

  const markWaiting = useCallback((worker: ServiceWorker | null | undefined) => {
    if (worker && navigator.serviceWorker.controller) {
      waitingWorkerRef.current = worker;
      setNeedRefresh(true);
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let reloaded = false;

    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };

    const listenForWaiting = (registration: ServiceWorkerRegistration) => {
      markWaiting(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            markWaiting(registration.waiting);
          }
        });
      });
    };

    const check = () => {
      if (document.visibilityState === 'visible') void regRef.current?.update();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      regRef.current = registration;
      setSupported(true);
      listenForWaiting(registration);

      document.addEventListener('visibilitychange', check);
      window.addEventListener('focus', check);
      intervalId = setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL);
    });

    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
      if (intervalId) clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, [markWaiting]);

  const applyUpdate = useCallback(() => {
    const waiting = waitingWorkerRef.current ?? regRef.current?.waiting;
    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  const dismiss = useCallback(() => setNeedRefresh(false), []);

  const checkForUpdate = useCallback(async () => {
    const reg = regRef.current;
    if (!reg) return;

    setChecking(true);
    try {
      await reg.update();
      markWaiting(reg.waiting);
    } catch {
      /* offline / transient */
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  }, [markWaiting]);

  const value = useMemo<PwaUpdateCtx>(
    () => ({
      supported,
      needRefresh,
      checking,
      version,
      applyUpdate,
      dismiss,
      checkForUpdate,
    }),
    [supported, needRefresh, checking, version, applyUpdate, dismiss, checkForUpdate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePwaUpdate(): PwaUpdateCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePwaUpdate must be used within <PwaUpdateProvider>');
  return ctx;
}
