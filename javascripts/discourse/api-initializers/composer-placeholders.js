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

function getLocaleLang() {
  try {
    const locale = typeof I18n?.currentLocale === "function" ? I18n.currentLocale() : "";
    const lang = String(locale || "").split(/[-_]/)[0] || "";
    return { locale, lang };
  } catch {
    return { locale: "", lang: "" };
  }
}

function normLocale(l) {
  return String(l || "").replace(/_/g, "-").toLowerCase();
}

function getDefaultLocale() {
  // i18n-js v4 uses defaultLocale; older variants sometimes expose default_locale
  const dl = I18n?.defaultLocale ?? I18n?.default_locale;
  return dl ? String(dl) : "";
}

function tForLocale(locale, key) {
  if (!locale || !key || typeof I18n?.t !== "function") return undefined;

  // Prefer per-call locale if supported
  try {
    return I18n.t(key, { locale });
  } catch {
    // fallback to temporarily switching global locale
  }

  const hasLocaleProp = "locale" in I18n;
  const oldLocale = hasLocaleProp ? I18n.locale : undefined;

  try {
    if (hasLocaleProp) I18n.locale = locale;
    return I18n.t(key);
  } finally {
    if (hasLocaleProp) I18n.locale = oldLocale;
  }
}

function isMissingValue(locale, key, v) {
  if (v == null) return true;
  if (typeof v !== "string") return false;

  const s = v.trim();
  if (s.length === 0) return true;

  // common "missing translation" markers
  if (
    s.startsWith(`[${locale}.`) ||
    s.startsWith(`[${String(locale).replace(/-/g, "_")}.`) ||
    s.startsWith("[missing") ||
    s.startsWith("translation missing:") ||
    s === key
  ) {
    return true;
  }

  return false;
}

function hasNonEmptyTranslation(locale, lang, key) {
  // Check current locale first, then base language (de-DE -> de)
  return (
    hasExplicitOverrideForLocale(locale, key) ||
    (lang && lang !== locale && hasExplicitOverrideForLocale(lang, key))
  );
}

function hasExplicitOverrideForLocale(locale, key) {
  if (!locale || !key) return false;

  const v = tForLocale(locale, key);
  if (isMissingValue(locale, key, v)) return false;

  const s = typeof v === "string" ? v.trim() : v;

  const nLoc = normLocale(locale);

  // Compare against english
  const en = "en";
  if (nLoc !== "en") {
    const vEn = tForLocale(en, key);
    if (!isMissingValue(en, key, vEn) && typeof vEn === "string" && vEn.trim() === s) {
      return false; // fallback-to-en, not an explicit locale value
    }
  }

  // Compare against default locale (often your site default; on your instance likely "ru")
  const def = getDefaultLocale();
  const nDef = normLocale(def);
  if (def && nDef && nDef !== nLoc) {
    const vDef = tForLocale(def, key);
    if (!isMissingValue(def, key, vDef) && typeof vDef === "string" && vDef.trim() === s) {
      return false; // fallback-to-default-locale (e.g. ru), not explicit
    }
  }

  return true;
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

          if (!key || !hasNonEmptyTranslation(locale, lang, key)) {
            const s = super.replyPlaceholder;
            return typeof s === "function"
              ? s.call(this, creatingTopic, replyingToTopic, privateMessage, action)
              : s;
          }

          log("replyPlaceholder ctx", { locale, lang, ...ctx });
          log("replyPlaceholder key", key);

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