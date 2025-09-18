import 'dart:async';
import 'package:flutter/material.dart';
import 'color_extractor.dart';

/// Manages background colors and provides caching for better performance
class BackgroundManager {
  static final BackgroundManager _instance = BackgroundManager._internal();
  factory BackgroundManager() => _instance;
  BackgroundManager._internal();

  final Map<String, ColorScheme> _colorCache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  static const Duration _cacheExpiry = Duration(hours: 1);

  /// Get cached colors or extract new ones
  Future<ColorScheme> getColorsForImage(
    String imageUrl, {
    bool forceRefresh = false,
  }) async {
    // Check cache first
    if (!forceRefresh && _colorCache.containsKey(imageUrl)) {
      final timestamp = _cacheTimestamps[imageUrl];
      if (timestamp != null && 
          DateTime.now().difference(timestamp) < _cacheExpiry) {
        return _colorCache[imageUrl]!;
      }
    }

    // Extract new colors
    final colors = await ColorExtractor.extractColorsFromUrl(imageUrl);
    
    // Cache the result
    _colorCache[imageUrl] = colors;
    _cacheTimestamps[imageUrl] = DateTime.now();
    
    return colors;
  }

  /// Preload colors for a list of image URLs
  Future<void> preloadColors(List<String> imageUrls) async {
    final futures = imageUrls.map((url) => getColorsForImage(url));
    await Future.wait(futures);
  }

  /// Clear expired cache entries
  void clearExpiredCache() {
    final now = DateTime.now();
    final expiredKeys = _cacheTimestamps.entries
        .where((entry) => now.difference(entry.value) > _cacheExpiry)
        .map((entry) => entry.key)
        .toList();

    for (final key in expiredKeys) {
      _colorCache.remove(key);
      _cacheTimestamps.remove(key);
    }
  }

  /// Clear all cache
  void clearCache() {
    _colorCache.clear();
    _cacheTimestamps.clear();
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    return {
      'cachedImages': _colorCache.length,
      'oldestEntry': _cacheTimestamps.values.isNotEmpty
          ? _cacheTimestamps.values.reduce((a, b) => a.isBefore(b) ? a : b)
          : null,
      'newestEntry': _cacheTimestamps.values.isNotEmpty
          ? _cacheTimestamps.values.reduce((a, b) => a.isAfter(b) ? a : b)
          : null,
    };
  }
}
