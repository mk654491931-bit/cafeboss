import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  isPreviewSession,
  PREVIEW_AUTH_EVENT,
} from "../lib/auth";

export function useSession(): {
  session: Session | null;
  loading: boolean;
  preview: boolean;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [preview, setPreview] = useState(() => isPreviewSession());

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const syncPreview = () => setPreview(isPreviewSession());
    window.addEventListener(PREVIEW_AUTH_EVENT, syncPreview);
    return () => window.removeEventListener(PREVIEW_AUTH_EVENT, syncPreview);
  }, []);

  return { session, loading, preview };
}
