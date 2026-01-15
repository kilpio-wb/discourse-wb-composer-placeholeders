import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

const DEBUG = (() => {
  try {
    const w = typeof window !== "undefined" ? window : null;
    const q = w?.location?.search || "";
    const ls = w?.localStorage?.getItem("wbComposerPlaceholdersDebug");
    return ls === "1" || /(^|[?&])wbComposerPlaceholdersDebug=1(&|$)/.test(q);
  } catch {
    return false;
  }
})();

const log = (...args) => DEBUG && console.log("[WB Composer Placeholders]", ...args);

function debugGroup(title, fn) {
  if (!DEBUG) return;
  try {
    console.groupCollapsed(title);
    fn();
  } finally {
    console.groupEnd();
  }
}

function safeI18nT(key) {
  try {
    return typeof I18n?.t === "function" ? I18n.t(key) : undefined;
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

function getLocaleLang() {
  try {
    const locale = typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "";
    const lang = String(locale || "").split(/[-_]/)[0] || "";
    return { locale, lang };
  } catch {
    return { locale: "", lang: "" };
  }
}

function getTranslationValueForLocale(locale, key) {
  const root = I18n?.translations?.[locale];
  if (!root) return undefined;

  return key.split(".").reduce((obj, part) => {
    if (!obj || typeof obj !== "object" || !(part in obj)) return undefined;
    return obj[part];
  }, root);
}

function hasNonEmptyTranslation(locale, lang, key) {
  const v =
    getTranslationValueForLocale(locale, key) ??
    (lang && getTranslationValueForLocale(lang, key));

  if (typeof v === "string") return v.trim().length > 0;
  return v != null;
}

function probeTranslation(locale, lang, key) {
  const rootLocale = I18n?.translations?.[locale];
  const rootLang = lang ? I18n?.translations?.[lang] : undefined;

  const vLocaleWalk = getTranslationValueForLocale(locale, key);
  const vLangWalk = lang ? getTranslationValueForLocale(lang, key) : undefined;

  const vLocaleFlat =
    rootLocale && Object.prototype.hasOwnProperty.call(rootLocale, key) ? rootLocale[key] : undefined;
  const vLangFlat =
    rootLang && Object.prototype.hasOwnProperty.call(rootLang, key) ? rootLang[key] : undefined;

  const i18nValue = safeI18nT(key);

  const leaf = String(key || "").split(".").slice(-1)[0] || "";
  const localeHints = rootLocale
    ? Object.keys(rootLocale)
        .filter((k) => k.includes(leaf) || k.includes("wb_") || k.includes("js.composer") || k.includes("theme_translation"))
        .slice(0, 50)
    : [];
  const langHints = rootLang
    ? Object.keys(rootLang)
        .filter((k) => k.includes(leaf) || k.includes("wb_") || k.includes("js.composer") || k.includes("theme_translation"))
        .slice(0, 50)
    : [];

  return {
    locale,
    lang,
    key,
    i18nValue,
    vLocaleWalk,
    vLangWalk,
    vLocaleFlat,
    vLangFlat,
    localeHasThemeTranslationObject: !!rootLocale?.theme_translation,
    langHasThemeTranslationObject: !!rootLang?.theme_translation,
    localeHints,
    langHints,
  };
}
function keyForContext({ creatingTopic, replyingToTopic, privateMessage, action }) {
  if (typeof themePrefix !== "function") {
    console.error("[WB Composer Placeholders] themePrefix not available");
    return null;
  }

  const isPm = !!privateMessage || action === "createPrivateMessage";

  if (isPm) return themePrefix("js.composer.wb_pm_placeholder");
  if (creatingTopic) return themePrefix("js.composer.wb_topic_placeholder");
  if (replyingToTopic) return themePrefix("js.composer.wb_reply_placeholder");

  return themePrefix("js.composer.wb_reply_placeholder");
}

export default apiInitializer("1.8.0", (api) => {
  log("MODULE LOADED");
  if (DEBUG) {
    try {
      const g = typeof globalThis !== "undefined" ? globalThis : window;
      g.WBComposerPlaceholdersDebug = {
        getLocaleLang,
        keyForContext,
        getTranslationValueForLocale,
        hasNonEmptyTranslation,
        probeTranslation,
      };
      console.info("[WB Composer Placeholders] Debug enabled. Disable: localStorage.removeItem('wbComposerPlaceholdersDebug') and reload.");
    } catch {}
  }

  if (typeof themePrefix !== "function") {
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
          if (!I18n || typeof I18n.currentLocale !== "function") {
            log("I18n missing, using super");
            const s = super.replyPlaceholder;
            return typeof s === "function"
              ? s.call(this, creatingTopic, replyingToTopic, privateMessage, action)
              : s;
          }

          const { locale, lang } = getLocaleLang();

          const model = this.composer?.model;

          const ctx = {
            creatingTopic: creatingTopic ?? model?.creatingTopic ?? false,
            replyingToTopic: replyingToTopic ?? model?.replyingToTopic ?? false,
            privateMessage: privateMessage ?? model?.privateMessage ?? false,
            action: action ?? model?.action,
          };

          const key = keyForContext(ctx);

          if (DEBUG) {
            log("replyPlaceholder ctx", { locale, lang, ...ctx });
            log("replyPlaceholder key", key);
            if (key) log("replyPlaceholder I18n.t(key)", safeI18nT(key));
          }

          if (!key || !hasNonEmptyTranslation(locale, lang, key)) {
            debugGroup("[WB Composer Placeholders] Fallback to super.replyPlaceholder", () => {
              console.log("ctx:", { locale, lang, ...ctx });
              console.log("key:", key);
              if (key) console.log("probe:", probeTranslation(locale, lang, key));
            });

            const s = super.replyPlaceholder;
            return typeof s === "function"
              ? s.call(this, creatingTopic, replyingToTopic, privateMessage, action)
              : s;
          }

          return key;
        }
      };
    });
  } catch (error) {
    console.error("[WB Composer Placeholders] Failed to modify composer-editor:", error);
    console.error("[WB Composer Placeholders] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  }
});
