"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function useToast(duration = 2500) {
  const [toast, setToast] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast(msg);
      timeoutRef.current = setTimeout(() => {
        setToast(null);
        timeoutRef.current = null;
      }, duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, showToast };
}
