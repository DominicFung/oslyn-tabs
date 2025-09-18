import 'package:flutter/material.dart';
import 'debug_logger.dart';

/// Advanced chord positioning engine that uses monospace anchoring for accuracy
/// This separates the positioning logic from the rendering logic for better maintainability
class ChordPositioningEngine {
  /// Enable detailed positioning logs
  static bool debugPositioning = true;
  
  /// Turn on/off positioning logs at runtime
  static void setDebugPositioning(bool value) {
    debugPositioning = value;
    DebugLogger.setEnabled(value);
  }

  /// Map chord position to lyric position using monospace anchoring
  /// This ensures consistent positioning regardless of the display font
  static int mapChordToLyricPositionMonospace({
    required int chordPos,
    required String chordLine,
    required String lyricLine,
    required double fontSize,
  }) {
    final stopwatch = Stopwatch()..start();
    
    if (lyricLine.isEmpty) {
      DebugLogger.positioning('Empty lyric line, returning chordPos: $chordPos');
      return chordPos;
    }

    DebugLogger.positioning('Mapping chord position $chordPos');
    DebugLogger.positioning('Chord line: "${chordLine}"');
    DebugLogger.positioning('Lyric line: "${lyricLine}"');

    // Step 1: Calculate character width in monospace font
    final monospaceCharWidth = _calculateMonospaceCharWidth(lyricLine, fontSize);
    DebugLogger.positioning('Monospace char width: ${monospaceCharWidth.toStringAsFixed(2)}px');

    // Step 2: Convert chord position to target character index using monospace
    int targetChar = (chordPos / monospaceCharWidth).round();
    targetChar = targetChar.clamp(0, lyricLine.length - 1);
    DebugLogger.positioning('Target character index: $targetChar (${lyricLine[targetChar]})');

    // Step 3: Find nearest anchor character
    final snappedIndex = _findNearestAnchor(targetChar, lyricLine);
    DebugLogger.positioning('Snapped to character index: $snappedIndex (${lyricLine[snappedIndex]})');

    stopwatch.stop();
    DebugLogger.performance('Chord position mapping', duration: stopwatch.elapsed);

    return snappedIndex;
  }

  /// Calculate the width of a single character in monospace font
  static double _calculateMonospaceCharWidth(String text, double fontSize) {
    if (text.isEmpty) return 0.0;

    final stopwatch = Stopwatch()..start();
    
    final painter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.left,
    );
    
    painter.text = TextSpan(
      text: text,
      style: TextStyle(
        fontFamily: 'monospace',
        fontSize: fontSize,
        fontWeight: FontWeight.normal,
      ),
    );
    
    painter.layout();
    final charWidth = painter.width / text.length;
    
    stopwatch.stop();
    DebugLogger.logFontMeasurement(
      text: text, 
      fontSize: fontSize, 
      fontFamily: 'monospace', 
      fontWeight: FontWeight.normal, 
      letterSpacing: 0.0, 
      measuredWidth: charWidth * text.length
    );
    DebugLogger.performance('Monospace char width calculation', duration: stopwatch.elapsed);
    
    return charWidth;
  }

  /// Find the nearest anchor character to the target position
  static int _findNearestAnchor(int targetPos, String lyricLine) {
    bool _isAnchor(String c) {
      // Treat letters/digits as anchors, plus common lyric separators and spaces
      if (RegExp(r'[A-Za-z0-9]').hasMatch(c)) return true;
      const allowed = "-'' "; // hyphen, straight/curly apostrophes, and space
      return allowed.contains(c);
    }

    // Clamp into bounds
    int idx = targetPos.clamp(0, lyricLine.length - 1);

    // If on anchor already, keep it
    if (_isAnchor(lyricLine[idx])) {
      DebugLogger.positioning('Already on anchor at $idx ("${lyricLine[idx]}")');
      return idx;
    }

    // Find nearest anchor characters
    int? leftIdx;
    for (int i = idx - 1; i >= 0 && i >= idx - 8; i--) {
      if (_isAnchor(lyricLine[i])) { 
        leftIdx = i; 
        break; 
      }
    }

    int? rightIdx;
    for (int i = idx + 1; i < lyricLine.length && i <= idx + 8; i++) {
      if (_isAnchor(lyricLine[i])) { 
        rightIdx = i; 
        break; 
      }
    }

    // Choose the closest candidate; tie-break toward the left
    final int leftDist = (leftIdx != null) ? (idx - leftIdx) : 1 << 30;
    final int rightDist = (rightIdx != null) ? (rightIdx - idx) : 1 << 30;
    final int finalIdx = (leftDist <= rightDist)
        ? (leftIdx ?? idx)
        : (rightIdx ?? idx);

    DebugLogger.positioning('Anchor candidates: left=$leftIdx (d=$leftDist) right=$rightIdx (d=$rightDist), chose=$finalIdx');
    if (finalIdx >= 0 && finalIdx < lyricLine.length) {
      DebugLogger.positioning('Final character="${lyricLine[finalIdx]}"');
    }

    return finalIdx;
  }

  /// Calculate pixel position using the actual display font
  /// This is called after monospace anchoring to get the final pixel position
  static double calculateChordPixelLeft({
    required int charPosition,
    required String referenceText,
    required double fontSize,
    required String fontFamily,
    required FontWeight fontWeight,
    required double letterSpacing,
  }) {
    final stopwatch = Stopwatch()..start();
    
    if (referenceText.isEmpty || charPosition <= 0) {
      DebugLogger.font('Empty text or position 0, returning 0.0');
      return 0.0;
    }

    final safeEnd = charPosition.clamp(0, referenceText.length);
    final leadingText = referenceText.substring(0, safeEnd);
    
    DebugLogger.font('Calculating pixel position for:');
    DebugLogger.font('Text: "${leadingText}"');
    DebugLogger.font('Font: $fontFamily, size: $fontSize, weight: $fontWeight');

    final painter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.left,
    );
    
    painter.text = TextSpan(
      text: leadingText,
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        fontFamily: fontFamily,
        fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
        letterSpacing: letterSpacing,
      ),
    );
    
    painter.layout();
    final pixelWidth = painter.width;

    stopwatch.stop();
    DebugLogger.font('Result: ${pixelWidth.toStringAsFixed(2)}px');
    DebugLogger.performance('Pixel position calculation', duration: stopwatch.elapsed);

    return pixelWidth;
  }

  /// Validate positioning accuracy by comparing monospace vs actual font
  static void validatePositioning({
    required String chordLine,
    required String lyricLine,
    required double fontSize,
    required String fontFamily,
    required FontWeight fontWeight,
    required double letterSpacing,
  }) {
    if (!debugPositioning) return;

    DebugLogger.validation('Comparing monospace vs actual font positioning');
    DebugLogger.validation('Chord line: "${chordLine}"');
    DebugLogger.validation('Lyric line: "${lyricLine}"');

    // Calculate monospace character width
    final monospaceCharWidth = _calculateMonospaceCharWidth(lyricLine, fontSize);
    
    // Calculate actual font character width (approximate)
    final actualFontPainter = TextPainter(
      text: TextSpan(
        text: lyricLine,
        style: TextStyle(
          fontFamily: fontFamily,
          fontSize: fontSize,
          fontWeight: fontWeight,
          letterSpacing: letterSpacing,
        ),
      ),
    );
    actualFontPainter.layout();
    final actualCharWidth = actualFontPainter.width / lyricLine.length;

    final widthDiff = (actualCharWidth - monospaceCharWidth).abs();
    
    DebugLogger.validation('Monospace char width: ${monospaceCharWidth.toStringAsFixed(2)}px');
    DebugLogger.validation('Actual font char width: ${actualCharWidth.toStringAsFixed(2)}px');
    DebugLogger.validation('Width difference: ${widthDiff.toStringAsFixed(2)}px');

    // Test a few chord positions
    int differences = 0;
    for (int i = 0; i < chordLine.length; i += 4) {
      if (i < chordLine.length) {
        final monospaceTarget = (i / monospaceCharWidth).round().clamp(0, lyricLine.length - 1);
        final actualTarget = (i / actualCharWidth).round().clamp(0, lyricLine.length - 1);
        
        if (monospaceTarget != actualTarget) {
          differences++;
        }
        
        DebugLogger.validation('Position $i: monospace->$monospaceTarget, actual->$actualTarget');
      }
    }
    
    // Log validation results
    final passed = differences == 0 && widthDiff < 2.0;
    DebugLogger.logValidation(
      testName: 'Monospace vs Actual Font Positioning',
      passed: passed,
      message: passed ? 'Positioning is consistent' : 'Found $differences differences with ${widthDiff.toStringAsFixed(2)}px width difference',
      details: {
        'differences': differences,
        'width_difference_px': widthDiff,
        'monospace_char_width': monospaceCharWidth,
        'actual_char_width': actualCharWidth,
      },
    );
  }
}
