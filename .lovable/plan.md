# Dark theme, particle logo, and SlingButton

## What will change
- Make the portfolio dark by default and add a saved light/dark icon toggle in the navigation.
- Replace the current multicolor particle logo with a crisp monochrome, layered particle treatment that responds to theme changes and retains its repel-and-return interaction.
- Add a self-contained SlingButton-style back-to-top control at the footer’s bottom-right using the supplied B&W configuration and theme-aware particle colors.
- Preserve the current typography, spacing, content, project interactions, contact form, and footer game behavior.

## Theme coverage
- Convert existing page, card, border, text, accent, canvas, wave, modal, and game colors to semantic theme tokens.
- Apply dark values on first visit, restore a saved choice on return, and animate the sun/moon icon without using system preference.
- Ensure canvas-based visuals rebuild when the theme changes.

## Technical details
- Add a small theme state/control in the existing page, with localStorage read after hydration to avoid rendering mismatches.
- Refine particle sampling using edge-aware placement plus three deterministic depth sizes and soft token-based shadows.
- Implement the footer control as an accessible React component supporting pointer drag/release, tap, Enter, and Space, with a short themed particle launch.
- Add reduced-motion fallbacks and complete the page’s social metadata fields.

## Verification
- Check the latest build result.
- Test first-visit dark mode, toggle persistence after reload, particle/logo contrast in both modes, footer scrolling, keyboard activation, and unchanged runner controls in desktop and mobile-sized browser views.
