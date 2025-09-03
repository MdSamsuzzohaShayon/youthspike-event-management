// Create a new hook useStableSocketHandlers.ts
import { useCallback, useRef } from "react";

export function useStableSocketHandlers() {
  const handlersRef = useRef<Map<string, Function>>(new Map());
  
  const addHandler = useCallback((event: string, handler: Function) => {
    handlersRef.current.set(event, handler);
  }, []);

  const getHandler = useCallback((event: string) => {
    return handlersRef.current.get(event);
  }, []);

  return { addHandler, getHandler, handlers: handlersRef.current };
}