# Chord Positioning System Refactor

## Overview
This refactor implements a more accurate chord positioning system that uses **monospace anchoring** for consistent character-to-position mapping, then renders using the actual display font.

## Problem Solved
The previous system anchored chords directly on the actual font, which could introduce positioning errors due to:
- Variable character widths in proportional fonts
- Font rendering differences across platforms
- Inconsistent spacing calculations

## Solution
The new system separates positioning into two phases:
1. **Monospace Anchoring**: Use a monospace font to determine which character to anchor to
2. **Actual Font Rendering**: Use the display font for final pixel positioning

## New Files

### `chord_positioning_engine.dart`
- **Purpose**: Core positioning logic using monospace anchoring
- **Key Methods**:
  - `mapChordToLyricPositionMonospace()`: Maps chord positions using monospace
  - `calculateChordPixelLeft()`: Calculates pixel positions using actual font
  - `validatePositioning()`: Debug method to compare monospace vs actual font

### `chord_lyric_display.dart`
- **Purpose**: Display rendering using the new positioning engine
- **Key Methods**:
  - `parseChordLyricPair()`: Parses chord-lyric pairs with monospace anchoring
  - `renderChordLyricLine()`: Renders using the new positioning system

### `positioning_test.dart`
- **Purpose**: Test widget to verify positioning accuracy
- **Features**:
  - Live font size adjustment
  - Debug information display
  - Real-time positioning validation

## Updated Files

### `line_widget.dart`
- Updated to use `ChordLyricDisplay` instead of `ChordLyricRenderer`
- No functional changes, just import updates

### `slides_widget.dart`
- Updated to use `ChordLyricDisplay` instead of `ChordLyricRenderer`
- Debug references updated

## Key Improvements

### 1. **Zero Anchoring Error**
- Monospace ensures consistent character-to-position mapping
- Eliminates font-dependent positioning errors

### 2. **Font Independence**
- Anchoring works regardless of display font
- Easy to change fonts without affecting positioning

### 3. **Better Debugging**
- Comprehensive logging at each step
- Validation methods to compare positioning approaches
- Test widget for visual verification

### 4. **Maintainability**
- Separated concerns: positioning vs rendering
- Clear, documented code structure
- Easy to test and debug

## Usage

### Basic Usage
```dart
// Parse chord-lyric pair with monospace anchoring
final pair = ChordLyricDisplay.parseChordLyricPair(chordLine, lyricLine);

// Render with accurate positioning
Widget chordLyricWidget = ChordLyricDisplay.renderChordLyricLine(
  pair,
  textSize: 'text-lg',
  dynamicFontSize: 32.0,
);
```

### Debug Mode
```dart
// Enable detailed positioning logs
ChordPositioningEngine.setDebugPositioning(true);
ChordLyricDisplay.setDebugSnapping(true);

// Validate positioning accuracy
ChordPositioningEngine.validatePositioning(
  chordLine: "G   D   C   G   D",
  lyricLine: "Were creation suddenly",
  fontSize: 32.0,
  fontFamily: '.SF Pro Text',
  fontWeight: FontWeight.w900,
  letterSpacing: 0.3,
);
```

### Testing
```dart
// Use the test widget to verify positioning
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => PositioningTestWidget()),
);
```

## Algorithm Details

### Phase 1: Monospace Anchoring
1. Calculate character width in monospace font
2. Convert chord position to target character index
3. Find nearest anchor character (letters, digits, spaces, punctuation)
4. Return character index for anchoring

### Phase 2: Actual Font Rendering
1. Use the anchored character index
2. Calculate pixel position using actual display font
3. Render chord chip at calculated position
4. Render lyric text with same font settings

## Benefits

- **Accuracy**: Chords align perfectly with intended lyric characters
- **Consistency**: Same positioning regardless of font changes
- **Debugging**: Easy to identify and fix positioning issues
- **Maintainability**: Clear separation of concerns
- **Performance**: Efficient positioning calculations

## Migration Notes

- All existing functionality preserved
- No breaking changes to public APIs
- Debug logging can be disabled for production
- Test widget can be removed after verification

## Future Enhancements

- Caching of positioning calculations
- Support for different monospace fonts
- Advanced snapping algorithms
- Performance optimizations
