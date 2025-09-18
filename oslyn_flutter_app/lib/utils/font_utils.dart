import 'package:flutter/material.dart';

/// Utility class for consistent San Francisco font usage throughout the app
class FontUtils {
  // San Francisco font families with fallbacks
  static const String sfProDisplay = '.SF Pro Display';
  static const String sfProText = '.SF Pro Text';
  
  // Alternative font names for different platforms
  static const String sfProDisplayAlt = 'SF Pro Display';
  static const String sfProTextAlt = 'SF Pro Text';
  
  // System font fallbacks
  static const String systemFont = 'system-ui';
  static const String defaultFont = 'Roboto';
  
  // Common text styles with San Francisco fonts
  static TextStyle get displayLarge => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 64,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get displayMedium => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 48,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get displaySmall => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 36,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get headlineLarge => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 32,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get headlineMedium => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 28,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get headlineSmall => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 24,
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get titleLarge => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 22,
    fontWeight: FontWeight.w600,
  );
  
  static TextStyle get titleMedium => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );
  
  static TextStyle get titleSmall => TextStyle(
    fontFamily: sfProDisplay,
    fontSize: 16,
    fontWeight: FontWeight.w600,
  );
  
  static TextStyle get bodyLarge => TextStyle(
    fontFamily: sfProText,
    fontSize: 18,
    fontWeight: FontWeight.normal,
  );
  
  static TextStyle get bodyMedium => TextStyle(
    fontFamily: sfProText,
    fontSize: 16,
    fontWeight: FontWeight.normal,
  );
  
  static TextStyle get bodySmall => TextStyle(
    fontFamily: sfProText,
    fontSize: 14,
    fontWeight: FontWeight.normal,
  );
  
  static TextStyle get labelLarge => TextStyle(
    fontFamily: sfProText,
    fontSize: 16,
    fontWeight: FontWeight.w500,
  );
  
  static TextStyle get labelMedium => TextStyle(
    fontFamily: sfProText,
    fontSize: 14,
    fontWeight: FontWeight.w500,
  );
  
  static TextStyle get labelSmall => TextStyle(
    fontFamily: sfProText,
    fontSize: 12,
    fontWeight: FontWeight.w500,
  );
  
  // Helper method to apply San Francisco font to any TextStyle
  static TextStyle applySFPro(TextStyle style, {bool isDisplay = false}) {
    return style.copyWith(
      fontFamily: isDisplay ? sfProDisplay : sfProText,
    );
  }
  
  // Helper method to create a TextStyle with San Francisco font
  static TextStyle sfPro({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    bool isDisplay = false,
  }) {
    return TextStyle(
      fontFamily: isDisplay ? sfProDisplay : sfProText,
      fontFamilyFallback: isDisplay 
          ? [sfProDisplayAlt, systemFont, defaultFont]
          : [sfProTextAlt, systemFont, defaultFont],
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: color,
    );
  }
}
