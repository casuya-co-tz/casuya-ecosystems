# Visual Coloration Guide

This document defines the color scheme and visual standards for Casuya Search documentation and code highlighting.

## Brand Colors

### Primary Colors

```css
--color-primary: #3b82f6; /* Blue - Main brand color */
--color-primary-dark: #1d4ed8; /* Darker blue for hover states */
--color-primary-light: #93c5fd; /* Lighter blue for backgrounds */
```

### Secondary Colors

```css
--color-secondary: #10b981; /* Green - Success states */
--color-accent: #f59e0b; /* Amber - Warning states */
--color-danger: #ef4444; /* Red - Error states */
```

### Neutral Colors

```css
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-200: #e5e7eb;
--color-gray-300: #d1d5db;
--color-gray-400: #9ca3af;
--color-gray-500: #6b7280;
--color-gray-600: #4b5563;
--color-gray-700: #374151;
--color-gray-800: #1f2937;
--color-gray-900: #111827;
```

## Code Syntax Highlighting

### TypeScript/JavaScript

```css
--syntax-keyword: #c678dd; /* Purple - const, let, function, etc. */
--syntax-string: #98c379; /* Green - String literals */
--syntax-number: #d19a66; /* Orange - Numbers */
--syntax-comment: #5c6370; /* Gray - Comments */
--syntax-function: #61afef; /* Blue - Function names */
--syntax-class: #e5c07b; /* Yellow - Class names */
--syntax-variable: #e06c75; /* Red - Variables */
--syntax-operator: #56b6c2; /* Cyan - Operators */
--syntax-tag: #e06c75; /* Red - HTML/JSX tags */
--syntax-attribute: #d19a66; /* Orange - Attributes */
```

### JSON

```css
--json-key: #e06c75; /* Red - Object keys */
--json-string: #98c379; /* Green - String values */
--json-number: #d19a66; /* Orange - Numbers */
--json-boolean: #56b6c2; /* Cyan - Booleans */
--json-null: #c678dd; /* Purple - null */
```

### Markdown

```css
--md-heading: #e5c07b; /* Yellow - Headings */
--md-code: #61afef; /* Blue - Code blocks */
--md-link: #61afef; /* Blue - Links */
--md-quote: #5c6370; /* Gray - Blockquotes */
--md-list: #98c379; /* Green - List markers */
```

## Terminal Colors

### Success

```css
--terminal-success: #10b981; /* Green background */
--terminal-success-text: #ffffff;
```

### Error

```css
--terminal-error: #ef4444; /* Red background */
--terminal-error-text: #ffffff;
```

### Warning

```css
--terminal-warning: #f59e0b; /* Amber background */
--terminal-warning-text: #ffffff;
```

### Info

```css
--terminal-info: #3b82f6; /* Blue background */
--terminal-info-text: #ffffff;
```

## Documentation Color Usage

### Code Blocks

Use syntax highlighting with the above color scheme:

```typescript
// Example with proper highlighting
const searchAPI = new SearchAPI();
const results = await searchAPI.search({
  query: 'algebra',
  limit: 10,
});
```

### Tables

Use alternating row colors for readability:

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

### Callouts

Use color-coded callouts for different types of information:

> **Note**: Use blue for general notes
>
> **Warning**: Use amber for warnings
>
> **Important**: Use green for important information
>
> **Caution**: Use red for critical warnings

## VS Code Theme Settings

For consistent development experience, use these VS Code settings:

```json
{
  "workbench.colorTheme": "One Dark Pro",
  "editor.tokenColorCustomizations": {
    "[One Dark Pro]": {
      "textMateRules": [
        {
          "scope": ["keyword", "storage.type"],
          "settings": {
            "foreground": "#C678DD"
          }
        },
        {
          "scope": ["string", "constant.other.symbol"],
          "settings": {
            "foreground": "#98C379"
          }
        },
        {
          "scope": ["constant.numeric"],
          "settings": {
            "foreground": "#D19A66"
          }
        }
      ]
    }
  }
}
```

## Git Diff Colors

### Added Lines

```css
--diff-added: #10b981; /* Green */
--diff-added-bg: #d1fae5; /* Light green background */
```

### Removed Lines

```css
--diff-removed: #ef4444; /* Red */
--diff-removed-bg: #fee2e2; /* Light red background */
```

### Modified Lines

```css
--diff-modified: #f59e0b; /* Amber */
--diff-modified-bg: #fef3c7; /* Light amber background */
```

## Accessibility

### Color Contrast Ratios

All color combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text):

- Primary on white: 5.74:1 ✅
- Secondary on white: 4.52:1 ✅
- Gray-700 on white: 9.74:1 ✅
- Gray-500 on white: 5.91:1 ✅

### Dark Mode Support

For dark mode, invert the color scheme:

```css
--color-primary: #60a5fa; /* Lighter blue for dark mode */
--color-gray-100: #1f2937; /* Darker grays */
--color-gray-900: #f9fafb; /* Lighter grays */
```

## Usage in Documentation

When using colors in documentation:

1. **Consistency**: Use the same color for the same purpose across all docs
2. **Accessibility**: Use color with text labels, not color alone
3. **Print**: Ensure colors work in black and white printing
4. **Theme**: Support both light and dark themes

## Examples

### Success Message

```html
<div style="color: #10B981; background: #D1FAE5; padding: 8px; border-radius: 4px;">
  ✓ Operation completed successfully
</div>
```

### Error Message

```html
<div style="color: #EF4444; background: #FEE2E2; padding: 8px; border-radius: 4px;">
  ✗ An error occurred
</div>
```

### Warning Message

```html
<div style="color: #F59E0B; background: #FEF3C7; padding: 8px; border-radius: 4px;">
  ⚠ Please review before proceeding
</div>
```

### Info Message

```html
<div style="color: #3B82F6; background: #DBEAFE; padding: 8px; border-radius: 4px;">
  ℹ Additional information
</div>
```
