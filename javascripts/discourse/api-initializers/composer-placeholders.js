import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

// IMPORTANT:
// Do NOT import themePrefix in a theme/component.
// It is already available in the theme build context, and importing it causes compile errors.
// (The compiler injects it via `virtual:theme`.) :contentReference[oaicite:1]{index=1}

const DEBUG = true;
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
  const isPm = !!privateMessage || action === "createPrivateMessage";

  // Your theme locale files contain:
  // en: js: composer: wb_reply_placeholder / wb_topic_placeholder / wb_pm_placeholder
  // so we reference those exact keys (and theme UI overrides can override them).
  if (isPm) return themePrefix("js.composer.wb_pm_placeholder");
  if (creatingTopic) return themePrefix("js.composer.wb_topic_placeholder");
  if (replyingToTopic) return themePrefix("js.composer.wb_reply_placeholder");

  // Fallback: treat as reply
  return themePrefix("js.composer.wb_reply_placeholder");
}

export default apiInitializer("1.8.0", (api) => {
  log("MODULE LOADED");

  api.modifyClass("component:composer-editor", (Superclass) => {
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
          return super.replyPlaceholder(...arguments);
        }

        const { locale, lang } = getLocaleLang();

        // Keep core behavior intact for all other languages
        if (!isEnabledLang(lang)) {
          return super.replyPlaceholder(...arguments);
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

        log("replyPlaceholder ctx", { locale, lang, ...ctx });
        log("replyPlaceholder key", key);
        log("preview I18n.t(key)", I18n.t(key));

        // Return a translation key; Discourse editor will translate it
        return key;
      }
    };
  });
});
