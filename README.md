# Discourse Composer Placeholders

A custom Discourse theme component (compatible with Discourse 2025.11+) that overrides placeholder text in the composer editor for a more personalized experience.

## Overview

This component customizes the placeholder text shown in Discourse's composer editor based on the context (reply, new topic, or private message) and supports multiple locales. It includes robust error handling, dynamic locale detection, and full support for customization via Discourse's admin interface.

## Features

- ✨ Custom placeholder text for different composer contexts
- 🌍 Multi-language support (English and Russian)
- 🔄 Graceful fallback to default placeholders for unsupported locales
- ⚙️ **Admin customization** - Override placeholders via `/admin/customize/text`
- 🛡️ Robust error handling and defensive programming
- 🔀 Dynamic locale detection at runtime
- 🎯 Context-aware placeholders:
  - **Replies**: "Write your reply…" / "Напишите ответ…"
  - **New Topics**: "Start a new topic…" / "Создайте новую тему…"
  - **Private Messages**: "Write a private message…" / "Напишите личное сообщение…"

## Requirements

- Discourse version 2025.11 or higher
- Theme component support enabled

## Installation

1. **Clone or download this repository** to your Discourse server

2. **Add as a theme component**:
   - Go to Admin → Customize → Themes
   - Create a new theme or edit an existing one
   - Click "Add Component" → "From Git Repository"
   - Enter the repository URL or path to this component
   - Alternatively, you can add it as a local component by uploading the files

3. **Enable the component**:
   - Ensure the component is enabled in your theme
   - The changes will take effect immediately

## Supported Locales

Currently supports:
- **English (en)**: Custom placeholders with ellipsis
- **Russian (ru)**: Custom placeholders in Russian

For all other locales, the component preserves Discourse's default placeholder behavior.

## Customization

### Via Admin Interface (Recommended)

You can customize the placeholder text directly from Discourse's admin panel:

1. Go to **Admin → Customize → Text** (`/admin/customize/text`)
2. Search for one of these translation keys:
   - `js.composer.wb_reply_placeholder`
   - `js.composer.wb_topic_placeholder`
   - `js.composer.wb_pm_placeholder`
3. Override with your custom text
4. Changes take effect immediately

**Translation Priority** (highest to lowest):
1. Overrides from `/admin/customize/text` (highest priority)
2. Translations from `locales/*.yml` files
3. Defaults set in `component.js` (lowest priority)

### Via Code

To add support for additional languages:

1. **Add locale file**: Create `locales/[lang].yml` with translations:
   ```yaml
   [lang]:
     js:
       composer:
         wb_reply_placeholder: "Your translation…"
         wb_topic_placeholder: "Your translation…"
         wb_pm_placeholder: "Your translation…"
   ```

2. **Update component.js**: Add the language check in the `enabled` condition (line 14):
   ```javascript
   const enabled = lang && (lang === "en" || lang === "ru" || lang === "fr");
   ```

3. **Add JavaScript defaults** (optional, as fallback):
   ```javascript
   if (lang === "fr") {
     I18n.translations[locale].js.composer.wb_reply_placeholder ||= "Écrivez votre réponse…";
     I18n.translations[locale].js.composer.wb_topic_placeholder ||= "Créer un nouveau sujet…";
     I18n.translations[locale].js.composer.wb_pm_placeholder ||= "Écrire un message privé…";
   }
   ```

## How It Works

The component:

1. **Initialization**: Checks for I18n availability and sets up default translations
2. **Locale Detection**: Dynamically detects the current locale at runtime (handles locale changes)
3. **Translation Setup**: Defines custom translation keys for supported languages (en/ru)
4. **Component Override**: Overrides the `replyPlaceholder` computed property in the `composer-editor` component
5. **Context Resolution**: Returns the appropriate placeholder based on the composer context:
   - Private message mode
   - Creating a new topic
   - Replying to an existing topic

## Technical Details

- Uses Discourse's API initializer (version 1.8.0+)
- Leverages `I18n` for internationalization
- Extends the `composer-editor` component using Discourse's class modification system
- Uses `@discourseComputed` decorator for reactive placeholder updates
- Includes defensive checks for I18n availability
- Handles errors gracefully with try-catch blocks
- Supports runtime locale changes (dynamic locale detection)

## File Structure

```
discourse-wb-composer-placeholeders/
├── about.json         # Theme component metadata (required)
├── component.js       # Main component logic
├── README.md          # This file
└── locales/
    ├── en.yml         # English translations
    └── ru.yml         # Russian translations
```

## Security & Robustness

The component includes several robustness features:

- ✅ Defensive checks for I18n availability
- ✅ Error handling around component modification
- ✅ Validation of locale format
- ✅ Graceful fallback to default behavior
- ✅ Dynamic locale detection (handles runtime changes)
- ✅ Safe translation key assignment (only sets if not overridden)

## License

This component is provided as-is for use with Discourse forums.

## Support

For issues or questions, please refer to your Discourse installation's support channels or create an issue in the repository.
