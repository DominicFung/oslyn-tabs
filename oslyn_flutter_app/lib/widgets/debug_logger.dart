import 'package:flutter/material.dart';

/// Log levels for different types of debug information
enum LogLevel {
  trace,    // Most verbose - every step
  debug,    // Detailed debugging info
  info,     // General information
  warning,  // Potential issues
  error,    // Errors and failures
}

/// Centralized debug logging system for chord positioning
/// Provides structured, color-coded logging with different verbosity levels
class DebugLogger {
  static bool _isEnabled = false;
  static bool _showTimestamps = true;
  static bool _showCallerInfo = true;
  static LogLevel _minLevel = LogLevel.info;
  
  /// Enable or disable debug logging
  static void setEnabled(bool enabled) {
    _isEnabled = enabled;
    if (enabled) {
      _log(LogLevel.info, 'DebugLogger', 'Debug logging enabled');
    }
  }
  
  /// Set minimum log level to filter out verbose logs
  static void setMinLevel(LogLevel level) {
    _minLevel = level;
    _log(LogLevel.info, 'DebugLogger', 'Minimum log level set to $level');
  }
  
  /// Enable/disable timestamps in logs
  static void setShowTimestamps(bool show) {
    _showTimestamps = show;
  }
  
  /// Enable/disable caller information in logs
  static void setShowCallerInfo(bool show) {
    _showCallerInfo = show;
  }
  
  /// Log positioning engine events
  static void positioning(String message, {LogLevel level = LogLevel.debug}) {
    _log(level, 'Positioning', message);
  }
  
  /// Log display renderer events
  static void display(String message, {LogLevel level = LogLevel.debug}) {
    _log(level, 'Display', message);
  }
  
  /// Log chord parsing events
  static void parsing(String message, {LogLevel level = LogLevel.debug}) {
    _log(level, 'Parsing', message);
  }
  
  /// Log font measurement events
  static void font(String message, {LogLevel level = LogLevel.debug}) {
    _log(level, 'Font', message);
  }
  
  /// Log validation events
  static void validation(String message, {LogLevel level = LogLevel.info}) {
    _log(level, 'Validation', message);
  }
  
  /// Log performance events
  static void performance(String message, {LogLevel level = LogLevel.info, Duration? duration, Map<String, dynamic>? metrics}) {
    _log(level, 'Performance', message);
    if (duration != null) {
      _log(level, 'Performance', 'Duration: ${duration.inMicroseconds / 1000}ms');
    }
    if (metrics != null) {
      metrics.forEach((key, value) {
        _log(level, 'Performance', '$key: $value');
      });
    }
  }
  
  /// Log warnings
  static void warning(String message) {
    _log(LogLevel.warning, 'Warning', message);
  }
  
  /// Log errors
  static void error(String message, {String? component, Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.error, component ?? 'Error', message);
    if (error != null) {
      _log(LogLevel.error, component ?? 'Error', 'Error details: $error');
    }
    if (stackTrace != null) {
      _log(LogLevel.error, component ?? 'Error', 'Stack trace: $stackTrace');
    }
  }
  
  /// Internal logging method
  static void _log(LogLevel level, String component, String message) {
    if (!_isEnabled || level.index < _minLevel.index) return;
    
    final timestamp = _showTimestamps ? '[${DateTime.now().millisecondsSinceEpoch}] ' : '';
    final levelStr = _getLevelString(level);
    final componentStr = '[$component]';
    final callerInfo = _showCallerInfo ? _getCallerInfo() : '';
    
    final logMessage = '$timestamp$levelStr $componentStr $callerInfo$message';
    
    // Use different colors for different log levels
    switch (level) {
      case LogLevel.trace:
        print('\x1B[90m$logMessage\x1B[0m'); // Gray
        break;
      case LogLevel.debug:
        print('\x1B[36m$logMessage\x1B[0m'); // Cyan
        break;
      case LogLevel.info:
        print('\x1B[32m$logMessage\x1B[0m'); // Green
        break;
      case LogLevel.warning:
        print('\x1B[33m$logMessage\x1B[0m'); // Yellow
        break;
      case LogLevel.error:
        print('\x1B[31m$logMessage\x1B[0m'); // Red
        break;
    }
  }
  
  /// Get formatted level string
  static String _getLevelString(LogLevel level) {
    switch (level) {
      case LogLevel.trace: return 'TRACE';
      case LogLevel.debug: return 'DEBUG';
      case LogLevel.info: return 'INFO ';
      case LogLevel.warning: return 'WARN ';
      case LogLevel.error: return 'ERROR';
    }
  }
  
  /// Get caller information (simplified)
  static String _getCallerInfo() {
    try {
      final stack = StackTrace.current;
      final lines = stack.toString().split('\n');
      if (lines.length > 2) {
        final caller = lines[2].trim();
        final match = RegExp(r'#\d+\s+(.+)').firstMatch(caller);
        if (match != null) {
          final method = match.group(1)?.split(' ').last ?? '';
          return '($method) ';
        }
      }
    } catch (e) {
      // Ignore errors in caller info
    }
    return '';
  }
  
  /// Log chord positioning with detailed metrics
  static void logChordPositioning({
    required String chordText,
    required int chordPos,
    required int lyricPos,
    required String lyricChar,
    required double monospaceCharWidth,
    required double actualFontCharWidth,
    required double pixelPosition,
  }) {
    positioning('Chord positioning details:', level: LogLevel.info);
    positioning('  Chord: "$chordText"', level: LogLevel.debug);
    positioning('  Chord position: $chordPos', level: LogLevel.debug);
    positioning('  Lyric position: $lyricPos', level: LogLevel.debug);
    positioning('  Lyric character: "$lyricChar"', level: LogLevel.debug);
    positioning('  Monospace char width: ${monospaceCharWidth.toStringAsFixed(2)}px', level: LogLevel.debug);
    positioning('  Actual font char width: ${actualFontCharWidth.toStringAsFixed(2)}px', level: LogLevel.debug);
    positioning('  Final pixel position: ${pixelPosition.toStringAsFixed(2)}px', level: LogLevel.debug);
    
    final widthDiff = (actualFontCharWidth - monospaceCharWidth).abs();
    if (widthDiff > 1.0) {
      warning('Significant width difference: ${widthDiff.toStringAsFixed(2)}px');
    }
  }
  
  /// Log font measurement details
  static void logFontMeasurement({
    required String text,
    required double fontSize,
    required String fontFamily,
    required FontWeight fontWeight,
    required double letterSpacing,
    required double measuredWidth,
  }) {
    font('Font measurement:', level: LogLevel.debug);
    font('  Text: "$text"', level: LogLevel.debug);
    font('  Font: $fontFamily $fontWeight ${fontSize}px', level: LogLevel.debug);
    font('  Letter spacing: $letterSpacing', level: LogLevel.debug);
    font('  Measured width: ${measuredWidth.toStringAsFixed(2)}px', level: LogLevel.debug);
  }
  
  /// Log parsing results
  static void logParsingResults({
    required String chordLine,
    required String lyricLine,
    required int chordCount,
    required List<String> chords,
  }) {
    parsing('Parsing results:', level: LogLevel.info);
    parsing('  Chord line: "$chordLine" (${chordLine.length} chars)', level: LogLevel.debug);
    parsing('  Lyric line: "$lyricLine" (${lyricLine.length} chars)', level: LogLevel.debug);
    parsing('  Found $chordCount chords: $chords', level: LogLevel.debug);
  }
  
  /// Log performance metrics
  static void logPerformance({
    required String operation,
    required Duration duration,
    required Map<String, dynamic>? metrics,
  }) {
    performance('$operation took ${duration.inMicroseconds / 1000}ms');
    if (metrics != null) {
      metrics.forEach((key, value) {
        performance('  $key: $value');
      });
    }
  }
  
  /// Log validation results
  static void logValidation({
    required String testName,
    required bool passed,
    required String? message,
    required Map<String, dynamic>? details,
  }) {
    final status = passed ? 'PASSED' : 'FAILED';
    final color = passed ? LogLevel.info : LogLevel.error;
    
    validation('$testName: $status', level: color);
    if (message != null) {
      validation('  $message', level: color);
    }
    if (details != null) {
      details.forEach((key, value) {
        validation('  $key: $value', level: color);
      });
    }
  }
}
