import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

const DEBUG = false;
const log = (...args) => DEBUG && console.log("[WB Composer Placeholders]", ...args);

function getLocaleLang() {
  try {
    const locale = typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "";
    const lang = String(locale || "").split(/[-_]/)[0] || "";
    return { locale, lang };
  } catch {
    return { locale: "", lang: "" };
  }
}

function isEnabledLang(lang) {
  return lang === "en" || lang === "ru";
}

function keyForContext({ creatingTopic, replyingToTopic, privateMessage, action }) {
  // Validate themePrefix is available
  if (typeof themePrefix !== 'function') {
    console.error("[WB Composer Placeholders] themePrefix not available");
    // Fallback to default Discourse behavior by returning undefined/null
    // This will cause the component to use its default placeholder
    return null;
  }

  const isPm = !!privateMessage || action === "createPrivateMessage";

  if (isPm) return themePrefix("js.composer.wb_pm_placeholder");
  if (creatingTopic) return themePrefix("js.composer.wb_topic_placeholder");
  if (replyingToTopic) return themePrefix("js.composer.wb_reply_placeholder");

  // Fallback: treat as reply
  return themePrefix("js.composer.wb_reply_placeholder");
}

export default apiInitializer("1.8.0", (api) => {
  log("MODULE LOADED");

  // Validate themePrefix at initialization
  if (typeof themePrefix !== 'function') {
    console.error("[WB Composer Placeholders] themePrefix not available, component disabled");
    return;
  }

  try {
    api.modifyClass("component:composer-editor", (Superclass) => {
      if (!Superclass) {
        console.warn("[WB Composer Placeholders] composer-editor component not found");
        return;
      }

      return class extends Superclass {
        @discourseComputed(
          "composer.model.creatingTopic",
          "composer.model.replyingToTopic",
          "composer.model.privateMessage",
          "composer.model.action"
        )
        replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action) {
          // If I18n isn't available, fall back to core behavior
          if (!I18n || typeof I18n.currentLocale !== "function") {
            log("I18n missing, using super");
            return super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
          }

          const { locale, lang } = getLocaleLang();

          // Keep core behavior intact for all other languages
          if (!isEnabledLang(lang)) {
            return super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
          }

          const model = this.composer?.model;

          // Use args first, then model fallback (defensive)
          const ctx = {
            creatingTopic: creatingTopic ?? model?.creatingTopic ?? false,
            replyingToTopic: replyingToTopic ?? model?.replyingToTopic ?? false,
            privateMessage: privateMessage ?? model?.privateMessage ?? false,
            action: action ?? model?.action,
          };

          const key = keyForContext(ctx);

          // If keyForContext returned null (themePrefix unavailable), fall back to super
          if (key === null) {
            return super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
          }

          log("replyPlaceholder ctx", { locale, lang, ...ctx });
          log("replyPlaceholder key", key);
          log("preview I18n.t(key)", I18n.t(key));

          // Return a translation key, Discourse editor will translate it
          return key;
        }
      };
    });
  } catch (error) {
    console.error("[WB Composer Placeholders] Failed to modify composer-editor:", error);
    console.error("[WB Composer Placeholders] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
});
