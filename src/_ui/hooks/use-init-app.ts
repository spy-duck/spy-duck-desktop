import { useEffect, useRef } from "react";
import { useVerge } from "@/hooks/use-verge";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { useClash } from "@/hooks/use-clash";
import { DEV_URLS, IS_DEV_MODE } from "@ui/consts";

const MAX_INIT_ATTEMPTS = 3;

export function useInitApp() {
  const initRef = useRef(false);

  const { verge } = useVerge();
  const { language } = verge ?? {};

  useEffect(() => {
    if (initRef.current) {
      console.log("[Layout] Initialization code has been executed, skipping");
      return;
    }
    console.log("[Layout] Start executing initialization code");
    initRef.current = true;

    let isInitialized = false;
    let initializationAttempts = 0;

    const performInitialization = async () => {
      if (isInitialized) {
        console.log("[Layout] Already initialized, skip");
        return;
      }

      initializationAttempts++;
      console.log(
        `[Layout] Start ${initializationAttempts} Initialization attempts`,
      );

      try {
        removeLoadingOverlay();
        await notifyBackend("Loading Phase", "Loading");

        await new Promise<void>((resolve) => {
          const checkReactMount = () => {
            const rootElement = document.getElementById("root");
            if (rootElement && rootElement.children.length > 0) {
              console.log("[Layout] React component mounted");
              resolve();
            } else {
              setTimeout(checkReactMount, 50);
            }
          };

          checkReactMount();

          setTimeout(() => {
            console.log(
              "[Layout] React component mounting check timed out, continue execution",
            );
            resolve();
          }, 2000);
        });

        await notifyBackend("DOM Ready", "DomReady");

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });

        await notifyBackend("Resource loading completed", "ResourcesLoaded");

        await notifyBackend("UI Ready");

        isInitialized = true;
        console.log(
          `[Layout] 第 ${initializationAttempts} Initialization completed`,
        );
      } catch (error) {
        console.error(
          `[Layout] 第 ${initializationAttempts} Initialization failed:`,
          error,
        );

        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
          console.log(
            `[Layout] Will be carried out after 500ms ${initializationAttempts + 1} retry`,
          );
          setTimeout(performInitialization, 500);
        } else {
          console.error(
            "[Layout] All initialization attempts failed, performing emergency initialization",
          );

          removeLoadingOverlay();
          try {
            await notifyBackend("UI Ready");
            isInitialized = true;
          } catch (e) {
            console.error("[Layout] Emergency initialization also failed:", e);
          }
        }
      }
    };
    let hasEventTriggered = false;

    const setupEventListener = async () => {
      try {
        console.log("[Layout] Start listening for startup completion events");
        return await listen("verge://startup-completed", () => {
          if (!hasEventTriggered) {
            console.log(
              "[Layout] Receive the startup completion event and start initialization",
            );
            hasEventTriggered = true;
            performInitialization();
          }
        });
      } catch (err) {
        console.error(
          "[Layout] Failed to listen for startup completion event:",
          err,
        );
        return () => {};
      }
    };

    const checkImmediateInitialization = async () => {
      try {
        console.log("[Layout] Check if the backend is ready");
        await invoke("update_ui_stage", { stage: "Loading" });

        if (!hasEventTriggered && !isInitialized) {
          console.log(
            "[Layout] The backend is ready, start initialization now",
          );
          hasEventTriggered = true;
          await performInitialization();
        }
      } catch (err) {
        console.log(
          "[Layout] The backend is not ready yet, waiting for the startup completion event",
        );
      }
    };

    const backupInitialization = setTimeout(async () => {
      if (!hasEventTriggered && !isInitialized) {
        console.warn(
          "[Layout] Backup initialization trigger: Initialization did not start within 1.5 seconds",
        );
        hasEventTriggered = true;
        await performInitialization();
      }
    }, 1500);

    const emergencyInitialization = setTimeout(() => {
      if (!isInitialized) {
        console.error(
          "[Layout] Emergency initialization trigger: Initialization is not completed within 5 seconds",
        );
        removeLoadingOverlay();
        notifyBackend("UI Ready").catch(() => {});
        isInitialized = true;
      }
    }, 5000);

    const unlistenPromise = setupEventListener();

    setTimeout(checkImmediateInitialization, 100);

    return () => {
      clearTimeout(backupInitialization);
      clearTimeout(emergencyInitialization);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (language) {
      dayjs.locale(language === "zh" ? "zh-cn" : language);
      i18next.changeLanguage(language);
    }
  }, [language]);

  const { clash, mutateClash, patchClash } = useClash();
  useEffect(() => {
    (async () => {
      const cors = clash?.["external-controller-cors"];
      const origins = cors?.["allow-origins"] ?? ["*"];
      console.log(origins);
      await patchClash({
        "external-controller-cors": {
          "allow-private-network": cors?.["allow-private-network"] ?? true,
          "allow-origins": [
            "https://spy-duck.com",
            ...filterDevOrigins(origins),
          ],
        },
      });
      await mutateClash();
    })();
  }, []);
}

const filterDevOrigins = (origins: string[]) => {
  if (IS_DEV_MODE) {
    return origins;
  }
  return origins.filter((origin: string) => !DEV_URLS.includes(origin.trim()));
};

const notifyBackend = async (action: string, stage?: string) => {
  try {
    if (stage) {
      console.log(`[Layout] Notification backend ${action}: ${stage}`);
      await invoke("update_ui_stage", { stage });
    } else {
      console.log(`[Layout] Notification backend ${action}`);
      await invoke("notify_ui_ready");
    }
  } catch (err) {
    console.error(`[Layout] Notification failure ${action}:`, err);
  }
};

const removeLoadingOverlay = () => {
  const initialOverlay = document.getElementById("initial-loading-overlay");
  if (initialOverlay) {
    console.log("[Layout] Remove loading indicator");
    initialOverlay.style.opacity = "0";
    setTimeout(() => {
      try {
        initialOverlay.remove();
      } catch (e) {
        console.log("[Layout] The loading indicator has been removed");
      }
    }, 300);
  }
};
