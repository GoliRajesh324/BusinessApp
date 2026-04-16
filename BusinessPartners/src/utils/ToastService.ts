let showFn: ((msg: string, type?: string) => void) | null = null;

export const registerToast = (fn: typeof showFn) => {
  showFn = fn;
};

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "success",
) => {
  if (showFn) {
    showFn(message, type);
  }
};
