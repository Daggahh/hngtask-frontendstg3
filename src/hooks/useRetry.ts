import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface RetryConfig {
  action: () => Promise<void>;
  errorTitle: string;
  maxAttempts?: number;
}

export const useRetry = () => {
  const [state, setState] = useState({ attempts: 0, isRetrying: false });

  const executeWithRetry = useCallback(
    async ({ action, errorTitle, maxAttempts = 2 }: RetryConfig) => {
      if (state.isRetrying) return false;

      try {
        setState((prev) => ({ ...prev, isRetrying: true }));
        await action();
        setState({ attempts: 0, isRetrying: false });
        return true;
      } catch (error) {
        const nextAttempt = state.attempts + 1;

        setState((prev) => ({
          ...prev,
          attempts: nextAttempt < maxAttempts ? nextAttempt : 0,
          isRetrying: false,
        }));

        toast({
          title: nextAttempt < maxAttempts ? errorTitle : "API Call Failed",
          description:
            nextAttempt < maxAttempts
              ? "An error occurred. Please try again."
              : "Maximum retry attempts reached. Please try again later.",
          variant: "destructive",
          duration: nextAttempt < maxAttempts ? 5000 : 3000,
        });

        return false;
      }
    },
    [state.attempts, state.isRetrying]
  );

  return { executeWithRetry, ...state };
};
