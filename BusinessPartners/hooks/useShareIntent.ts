import { showToast } from "@/src/utils/ToastService";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import ReceiveSharingIntent from "react-native-receive-sharing-intent";

export default function useShareIntent(onReceive: (files: any[]) => void) {
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handleShare = () => {
      if (hasProcessedRef.current) return;
      ReceiveSharingIntent.getReceivedFiles(
        (files: any[]) => {
          if (!files || files.length === 0) return;
          hasProcessedRef.current = true;

          const formatted = files
            .map((f: any, i: number) => {
              let uri = f.filePath || f.contentUri;

              if (!uri) return null;

              if (!uri.startsWith("content://") && !uri.startsWith("file://")) {
                uri = "file://" + uri;
              }

              return {
                uri,
                type: f.mimeType || "image/jpeg",
                name: f.fileName || `shared_${i}.jpg`,
              };
            })
            .filter(
              (f): f is { uri: string; type: string; name: string } => !!f,
            ); // ✅ IMPORTANT

          console.log("📥 Share received:", formatted);

          // ✅ SHOW DEBUG TOAST (SAFE)
          if (formatted && formatted.length > 0) {
            const first = formatted.length > 0 ? formatted[0] : null;

            const msg = first?.uri?.startsWith("content://")
              ? "content:// image received"
              : first?.uri?.startsWith("file://")
                ? "file:// image received"
                : "unknown image type";

            // ⚠️ IMPORTANT: wrap in setTimeout (avoids crash)
            setTimeout(() => {
              try {
                showToast(msg, "info");
              } catch (e) {
                // fallback if toast fails
                alert(msg);
              }
            }, 300);
          }

          // ✅ THEN call your main handler

          onReceive(formatted);

          // ✅ delay clearing (IMPORTANT)
          setTimeout(() => {
            ReceiveSharingIntent.clearReceivedFiles();
            // ✅ allow next share
            hasProcessedRef.current = false;
          }, 1500);
        },
        (error: any) => console.log("Share error:", error),
      );
    };

    // ✅ CALL ON LOAD
    handleShare();

    // ✅ ALSO CALL WHEN APP COMES TO FOREGROUND
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setTimeout(() => {
          handleShare();
        }, 500);
      }
    });

    return () => {
      sub.remove();
    };
  }, [onReceive]);
}
