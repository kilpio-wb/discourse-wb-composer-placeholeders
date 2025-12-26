import { apiInitializer } from "discourse/lib/api";
import I18n from "I18n";
import discourseComputed from "discourse-common/utils/decorators";

export default apiInitializer("1.8.0", (api) => {
  // Defensive check for I18n availability
  if (!I18n || !I18n.translations) {
    console.warn("I18n not available, composer placeholders component disabled");
    return;
  }

  const locale = I18n.currentLocale() || "";
  const lang = String(locale).split(/[-_]/)[0] || ""; // "en", "ru", etc.
  const enabled = lang && (lang === "en" || lang === "ru");

  // Only define translations for EN/RU. Other locales stay untouched.
  if (enabled && locale) {
    I18n.translations[locale] ||= {};
    I18n.translations[locale].js ||= {};
    I18n.translations[locale].js.composer ||= {};

    if (lang === "en") {
      // Only set if not already overridden via /admin/customize/text
      I18n.translations[locale].js.composer.wb_reply_placeholder ||= "Write your reply…";
      I18n.translations[locale].js.composer.wb_topic_placeholder ||= "Start a new topic…";
      I18n.translations[locale].js.composer.wb_pm_placeholder ||= "Write a private message…";
    }

    if (lang === "ru") {
      // Only set if not already overridden via /admin/customize/text
      I18n.translations[locale].js.composer.wb_reply_placeholder ||= "Напишите ответ…";
      I18n.translations[locale].js.composer.wb_topic_placeholder ||= "Создайте новую тему…";
      I18n.translations[locale].js.composer.wb_pm_placeholder ||= "Напишите личное сообщение…";
    }
  }

  try {
    api.modifyClass("component:composer-editor", (Superclass) => {
      if (!Superclass) {
        console.warn("composer-editor component not found");
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
          // Defensive check for I18n availability
          if (!I18n || !I18n.currentLocale) {
            return super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
          }

          // Compute enabled dynamically to handle locale changes at runtime
          const currentLocale = I18n.currentLocale() || "";
          const currentLang = String(currentLocale).split(/[-_]/)[0] || "";
          const isEnabled = currentLang && (currentLang === "en" || currentLang === "ru");

          // For non EN/RU locales keep core placeholder behavior intact.
          if (!isEnabled) {
            return super.replyPlaceholder(creatingTopic, replyingToTopic, privateMessage, action);
          }

          const isPm = !!privateMessage || action === "createPrivateMessage";
          
          // Return translation keys - the component will translate them using I18n.t()
          // Overrides from /admin/customize/text will be respected when I18n.t() is called
          // Note: Discourse automatically looks in js.* namespace, so we use "composer.*" format
          if (isPm) return "composer.wb_pm_placeholder";
          if (creatingTopic) return "composer.wb_topic_placeholder";
          if (replyingToTopic) return "composer.wb_reply_placeholder";

          return "composer.wb_reply_placeholder";
        }
      };
    });
  } catch (error) {
    console.error("Failed to modify composer-editor:", error);
  }
});

