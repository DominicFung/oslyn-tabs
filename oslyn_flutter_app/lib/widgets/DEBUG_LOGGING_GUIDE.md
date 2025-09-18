# Debug Logging System Guide

## Overview
The chord positioning system now includes comprehensive debug logging to help you understand exactly how chords are positioned and rendered. The logging system provides structured, color-coded output with different verbosity levels.

## Features

### 🎨 **Color-Coded Logging**
- **Gray**: TRACE - Most verbose logging
- **Cyan**: DEBUG - Detailed debugging information  
- **Green**: INFO - General information
- **Yellow**: WARNING - Potential issues
- **Red**: ERROR - Errors and failures

### 📊 **Performance Metrics**
- Execution time for each operation
- Detailed metrics for rendering operations
- Memory usage tracking (where applicable)

### 🔍 **Structured Logging**
- Component-based logging (Positioning, Display, Parsing, Font, Validation)
- Timestamp support (optional)
- Caller information (optional)
- Configurable verbosity levels

## Usage

### Basic Setup
```dart
// Enable debug logging
DebugLogger.setEnabled(true);
DebugLogger.setMinLevel(LogLevel.debug);

// Enable positioning engine logging
ChordPositioningEngine.setDebugPositioning(true);

// Enable display renderer logging
ChordLyricDisplay.setDebugSnapping(true);
```

### Log Levels
```dart
// Set minimum log level to filter verbose logs
DebugLogger.setMinLevel(LogLevel.info);  // Only show info, warning, error
DebugLogger.setMinLevel(LogLevel.debug); // Show debug and above
DebugLogger.setMinLevel(LogLevel.trace); // Show everything
```

### Component-Specific Logging
```dart
// Positioning engine logs
DebugLogger.positioning('Mapping chord position 4');

// Display renderer logs  
DebugLogger.display('Rendering chord-lyric line');

// Parsing logs
DebugLogger.parsing('Found 3 chords in line');

// Font measurement logs
DebugLogger.font('Calculating pixel position');

// Validation logs
DebugLogger.validation('Positioning accuracy check');

// Performance logs
DebugLogger.performance('Operation completed', 
  duration: Duration(milliseconds: 15),
  metrics: {'chord_count': 5, 'font_size': 32.0}
);
```

## Log Output Examples

### Chord Positioning
```
[1234567890] DEBUG [Positioning] Mapping chord position 4
[1234567890] DEBUG [Positioning] Chord line: "G   D   C   G   D"
[1234567890] DEBUG [Positioning] Lyric line: "Were creation suddenly"
[1234567890] DEBUG [Positioning] Monospace char width: 8.50px
[1234567890] DEBUG [Positioning] Target character index: 0 (W)
[1234567890] DEBUG [Positioning] Snapped to character index: 0 (W)
[1234567890] INFO  [Performance] Chord position mapping took 2.3ms
```

### Font Measurement
```
[1234567890] DEBUG [Font] Font measurement:
[1234567890] DEBUG [Font]   Text: "Were"
[1234567890] DEBUG [Font]   Font: .SF Pro Text FontWeight.w900 32.0px
[1234567890] DEBUG [Font]   Letter spacing: 0.3
[1234567890] DEBUG [Font]   Measured width: 45.20px
[1234567890] INFO  [Performance] Pixel position calculation took 1.8ms
```

### Validation Results
```
[1234567890] INFO  [Validation] Monospace vs Actual Font Positioning: PASSED
[1234567890] INFO  [Validation]   Positioning is consistent
[1234567890] INFO  [Validation]   differences: 0
[1234567890] INFO  [Validation]   width_difference_px: 0.5
[1234567890] INFO  [Validation]   monospace_char_width: 8.5
[1234567890] INFO  [Validation]   actual_char_width: 9.0
```

## Configuration Options

### Timestamps
```dart
// Show timestamps in logs
DebugLogger.setShowTimestamps(true);

// Hide timestamps
DebugLogger.setShowTimestamps(false);
```

### Caller Information
```dart
// Show caller method names
DebugLogger.setShowCallerInfo(true);

// Hide caller information
DebugLogger.setShowCallerInfo(false);
```

### Log Level Filtering
```dart
// Only show errors
DebugLogger.setMinLevel(LogLevel.error);

// Show warnings and above
DebugLogger.setMinLevel(LogLevel.warning);

// Show all logs
DebugLogger.setMinLevel(LogLevel.trace);
```

## Debug Widget

The `PositioningTestWidget` provides a visual interface for testing and debugging:

```dart
// Navigate to test widget
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => PositioningTestWidget()),
);
```

### Test Widget Features
- **Live Font Size Adjustment**: Test different font sizes
- **Real-time Debug Toggle**: Enable/disable logging
- **Visual Verification**: See chord positioning in real-time
- **Console Integration**: View detailed logs in console

## Performance Monitoring

### Built-in Performance Tracking
```dart
// Automatic performance logging for:
// - Chord position mapping
// - Font measurements  
// - Pixel calculations
// - Rendering operations
// - Parsing operations
```

### Custom Performance Logging
```dart
final stopwatch = Stopwatch()..start();
// ... your operation ...
stopwatch.stop();

DebugLogger.performance('Custom operation', 
  duration: stopwatch.elapsed,
  metrics: {
    'items_processed': 42,
    'memory_used': '2.1MB',
    'cache_hits': 15,
  }
);
```

## Troubleshooting

### Common Issues

1. **Too Much Logging**
   ```dart
   // Reduce verbosity
   DebugLogger.setMinLevel(LogLevel.info);
   ```

2. **Missing Logs**
   ```dart
   // Ensure logging is enabled
   DebugLogger.setEnabled(true);
   ChordPositioningEngine.setDebugPositioning(true);
   ```

3. **Performance Impact**
   ```dart
   // Disable in production
   DebugLogger.setEnabled(false);
   ```

### Debug Tips

1. **Start with INFO level** to see the big picture
2. **Use DEBUG level** for detailed analysis
3. **Use TRACE level** only when investigating specific issues
4. **Check console output** for detailed positioning information
5. **Use the test widget** for visual verification

## Production Usage

### Disable Debug Logging
```dart
// Disable all debug logging for production
DebugLogger.setEnabled(false);
ChordPositioningEngine.setDebugPositioning(false);
ChordLyricDisplay.setDebugSnapping(false);
```

### Conditional Logging
```dart
// Only enable in debug mode
if (kDebugMode) {
  DebugLogger.setEnabled(true);
  DebugLogger.setMinLevel(LogLevel.info);
}
```

## Advanced Usage

### Custom Log Messages
```dart
// Log custom positioning information
DebugLogger.logChordPositioning(
  chordText: 'G',
  chordPos: 0,
  lyricPos: 0,
  lyricChar: 'W',
  monospaceCharWidth: 8.5,
  actualFontCharWidth: 9.0,
  pixelPosition: 0.0,
);
```

### Validation Testing
```dart
// Test positioning accuracy
ChordPositioningEngine.validatePositioning(
  chordLine: "G   D   C   G   D",
  lyricLine: "Were creation suddenly",
  fontSize: 32.0,
  fontFamily: '.SF Pro Text',
  fontWeight: FontWeight.w900,
  letterSpacing: 0.3,
);
```

This debug logging system provides comprehensive visibility into the chord positioning process, making it easy to identify and fix any positioning issues while maintaining excellent performance in production.
