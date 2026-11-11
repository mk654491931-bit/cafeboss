import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toTurkishError } from "../lib/errors";
import {
  isPreviewSession,
  PREVIEW_AUTH_EVENT,
} from "../lib/auth";

const SESSION_TIMEOUT_MS = 8_000;

export function useSession(): {
  session: Session | null;
  loading: boolean;
  preview: boolean;
  error: string | null;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [preview, setPreview] = useState(() => isPreviewSession());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    let timeoutId: number | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("Oturum kontrolü zaman aşımına uğradı.")),
        SESSION_TIMEOUT_MS,
      );
    });

    Promise.race([supabase.auth.getSession(), timeout])
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(toTurkishError(caught));
      })
      .finally(() => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      active = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncPreview = () => setPreview(isPreviewSession());
    window.addEventListener(PREVIEW_AUTH_EVENT, syncPreview);
    return () => window.removeEventListener(PREVIEW_AUTH_EVENT, syncPreview);
  }, []);

  return { session, loading, preview, error };
}
