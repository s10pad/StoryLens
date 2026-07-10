# StoryLens Mobile - UI Document

## Visual Style
- **Backgrounds**: Deep black (`#06060a`) with subtle, blurred background blobs for a premium studio feel.
- **Typography**: 
  - Primary text: Clean sans-serif (e.g., Inter or Roboto).
  - Headings/Accents: Serif (e.g., Playfair Display) for cinematic elegance.
  - Inputs/Logs: Monospace (e.g., JetBrains Mono) for a "scriptwriting" or "terminal" vibe.
- **Colors**:
  - Gold Accent: `#e8c547`
  - Success: `#2ecc71`
  - Dim Text: `#666666` or `#aaaaaa`

## Required Components
1. **`<ScreenWrapper>`**: Applies the safe area views, dark background, and custom fonts.
2. **`<CinematicInput>`**: A multiline text area with glowing borders on focus.
3. **`<SelectChip>`**: Horizontal scrollable list of chips for selecting Genre/Tone.
4. **`<GenerateButton>`**: A prominent, pulsing golden button.
5. **`<PipelineLog>`**: A monospace scrolling list that shows live generation status.
6. **`<NativePlayer>`**: A wrapper around `expo-av` Video component for viewing the result.
