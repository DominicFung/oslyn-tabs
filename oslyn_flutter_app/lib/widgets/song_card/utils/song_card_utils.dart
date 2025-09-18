import 'package:flutter/material.dart';

/// Utility class for song card operations
class SongCardUtils {
  /// Calculate the optimal font size based on screen dimensions
  static double calculateOptimalFontSize(double screenWidth, double screenHeight) {
    // Base font size calculation
    final baseFontSize = screenWidth * 0.04; // 4% of screen width
    final minFontSize = 12.0;
    final maxFontSize = 24.0;
    
    return baseFontSize.clamp(minFontSize, maxFontSize);
  }
  
  /// Calculate optimal spacing based on screen size
  static double calculateOptimalSpacing(double screenHeight) {
    return screenHeight * 0.02; // 2% of screen height
  }
  
  /// Check if the device is in landscape mode
  static bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }
  
  /// Get responsive padding based on screen size
  static EdgeInsets getResponsivePadding(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final basePadding = screenWidth * 0.05; // 5% of screen width
    
    return EdgeInsets.symmetric(
      horizontal: basePadding.clamp(16.0, 32.0),
      vertical: basePadding.clamp(8.0, 16.0),
    );
  }
  
  /// Format time duration in MM:SS format
  static String formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }
  
  /// Truncate text with ellipsis if it exceeds max length
  static String truncateText(String text, int maxLength) {
    if (text.length <= maxLength) return text;
    return '${text.substring(0, maxLength)}...';
  }
  
  /// Get total pages for a given content
  static int getTotalPages(dynamic content) {
    if (content == null) return 0;
    // This is a placeholder implementation
    // In a real app, this would calculate based on content length
    return 1;
  }
}
