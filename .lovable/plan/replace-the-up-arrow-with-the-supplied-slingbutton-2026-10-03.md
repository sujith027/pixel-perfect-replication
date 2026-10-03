# Replace the up-arrow with the supplied SlingButton

## Changes
- Replace the current simplified footer control with the full supplied SlingButton interaction.
- Keep the existing back-to-top action and selected settings: vertical pull, 110px maximum, 8 particles, responsive 48/56px sizing, and theme-aware colors.
- Add the supplied motion and icon dependencies, with isolated SlingButton styling.

## Verification
- Confirm click, keyboard activation, and vertical drag all return the page to the top.
- Check desktop and mobile sizing, dark/light themes, reduced-motion behavior, and browser errors.

## Technical details
- Adapt the supplied JavaScript component to typed React while preserving its spring, tension-band, armed state, and particle behavior.
- Keep the component client-safe and avoid changing any unrelated portfolio sections.
