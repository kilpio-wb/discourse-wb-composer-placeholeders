# Discourse Composer Placeholders

A custom Discourse theme component that customizes placeholder text in the composer editor based on context (reply, new topic, or private message).

## Overview

This component overrides the `replyPlaceholder` method in Discourse's `composer-editor` component to provide context-aware placeholder text. It uses Discourse's theme translation system with `themePrefix()` to support both default translations and admin overrides.

## Features

- ✨ **Context-aware placeholders** - Different text for replies, new topics, and private messages
- 🌍 **Multi-language support** - English and Russian included, easily extensible
- 🔄 **Graceful fallback** - Uses default Discourse placeholders for unsupported locales
- ⚙️ **Admin customization** - Override placeholders via Theme Translations in admin panel
- 🛡️ **Robust error handling** - Validates dependencies and handles errors gracefully
- 🔀 **Dynamic locale detection** - Automatically adapts to user's current locale

## Requirements

- Discourse version 3.0.0 or higher
- Theme component support enabled

## Installation (Discourse 2025.11)

1. Go to **Admin → Appearance → Themes and components**  
   (or open `/admin/config/customize/themes` directly).
2. Open the **Components** tab.
3. Click **Install**.
4. Choose **From a Git repository**.
5. Paste the repository URL: `https://github.com/kilpio-wb/discourse-wb-composer-placeholeders`
6. Click **Install**.
7. Select themes  **Include component on these themes** to add the component to your active theme.

## Customization

### Via Admin Interface (Theme Translations)

You can override the default placeholders directly from the Discourse admin panel:

1. Go to **Admin → Appearance → Themes & components → Components**
3. Find the **"Composer Placeholders"** component
4. Click on the component to open its settings (you may press **Edit** button also)
5. Go to the **"Translations"** tab
6. Override any of these translation keys:
   - `js.composer.wb_reply_placeholder`
   - `js.composer.wb_topic_placeholder`
   - `js.composer.wb_pm_placeholder`
7. Enter your custom text
8. Save the theme

**Translation Priority** (highest to lowest):
1. Theme Translations overrides (set in admin panel) - **Highest priority**
2. Translations from `locales/*.yml` files (defaults)
3. Default Discourse placeholders (fallback for unsupported locales)

### Via Code (Adding New Languages)

To add support for additional languages:

1. **Create a locale file**: `locales/[lang].yml`
   ```yaml
   [lang]:
     js:
       composer:
         wb_reply_placeholder: "Your translation…"
         wb_topic_placeholder: "Your translation…"
         wb_pm_placeholder: "Your translation…"
   ```

2. **Update the language check** in `javascripts/discourse/api-initializers/composer-placeholders.js`:
   ```javascript
   function isEnabledLang(lang) {
     return lang === "en" || lang === "ru" || lang === "fr"; // Add your language
   }
   ```

## How It Works

1. **Initialization**: 
   - Validates that `themePrefix` is available (required for theme translations)
   - Exits gracefully if dependencies are missing

2. **Component Override**:
   - Extends the `composer-editor` component
   - Overrides the `replyPlaceholder` computed property

3. **Context Detection**:
   - Detects composer context (reply, new topic, or private message)
   - Determines current locale dynamically

4. **Translation Resolution**:
   - Uses `themePrefix()` to generate theme-specific translation keys
   - Returns translation keys that Discourse's I18n system resolves
   - Falls back to default Discourse behavior for unsupported locales

5. **Error Handling**:
   - Validates I18n availability
   - Checks locale support
   - Falls back to super method if anything fails

## Technical Details

- **API Version**: Uses Discourse API initializer version 1.8.0+
- **Translation System**: Uses `themePrefix()` from `virtual:theme` for theme-specific translations
- **Component Extension**: Extends `component:composer-editor` using Discourse's class modification system
- **Reactive Updates**: Uses `@discourseComputed` decorator for automatic updates when composer state changes
- **Error Handling**: Comprehensive try-catch blocks and validation checks
- **Defensive Programming**: Multiple fallback mechanisms to ensure stability

## File Structure

```
discourse-wb-composer-placeholeders/
├── about.json                                    # Theme component metadata
├── README.md                                     # This file
├── javascripts/
│   └── discourse/
│       └── api-initializers/
│           └── composer-placeholders.js          # Main component logic
└── locales/
    ├── en.yml                                    # English translations
    └── ru.yml                                    # Russian translations
```

## Security & Robustness

The component includes several safety features:

- ✅ **Dependency Validation**: Checks for `themePrefix` and `I18n` availability
- ✅ **Error Handling**: Try-catch blocks around critical operations
- ✅ **Graceful Fallbacks**: Falls back to default Discourse behavior on errors
- ✅ **Input Validation**: Validates locale format and component state
- ✅ **Defensive Programming**: Multiple safety checks and null handling
- ✅ **No Runtime Injection**: Uses Discourse's built-in translation system

## Debugging

The component includes optional debug logging. To enable it, set `DEBUG = true` in `composer-placeholders.js`:

```javascript
const DEBUG = true; // Change from false to true
```

This will log context information, translation keys, and resolution results to the browser console.

## Version

Current version: **1.1.2**

## License

This component is provided as-is for use with Discourse forums.

## Support

For issues or questions:
- Check the [GitHub repository](https://github.com/kilpio-wb/discourse-wb-composer-placeholeders)
- Refer to your Discourse installation's support channels
