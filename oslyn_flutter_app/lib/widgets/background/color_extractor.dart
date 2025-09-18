import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:palette_generator/palette_generator.dart';

/// Represents a color positioned on the screen with animation properties
class ColorPosition {
  final Color color;
  final Offset center;
  final double radius;
  final Offset velocity; // Movement velocity
  final double rotationSpeed; // Rotation speed for the gradient
  final List<Offset> shapePoints; // Points defining the organic shape
  final double irregularity; // How irregular the shape is (0-1)
  
  const ColorPosition({
    required this.color,
    required this.center,
    required this.radius,
    this.velocity = const Offset(0, 0),
    this.rotationSpeed = 0.0,
    this.shapePoints = const [],
    this.irregularity = 0.0,
  });

  /// Create a copy with updated position
  ColorPosition copyWith({
    Color? color,
    Offset? center,
    double? radius,
    Offset? velocity,
    double? rotationSpeed,
    List<Offset>? shapePoints,
    double? irregularity,
  }) {
    return ColorPosition(
      color: color ?? this.color,
      center: center ?? this.center,
      radius: radius ?? this.radius,
      velocity: velocity ?? this.velocity,
      rotationSpeed: rotationSpeed ?? this.rotationSpeed,
      shapePoints: shapePoints ?? this.shapePoints,
      irregularity: irregularity ?? this.irregularity,
    );
  }

  /// Update position based on velocity and time delta
  ColorPosition updatePosition(double deltaTime) {
    return copyWith(
      center: center + velocity * deltaTime,
    );
  }
}

/// Utility class for extracting colors from images
class ColorExtractor {
  /// Check if a color is too close to white
  static bool _isWhiteish(Color color) {
    // Check if color is close to white (high brightness, low saturation)
    final hsl = HSLColor.fromColor(color);
    return hsl.lightness > 0.8 && hsl.saturation < 0.3;
  }

  /// Check if a color is too light for good white text contrast
  static bool _isTooLight(Color color) {
    final hsl = HSLColor.fromColor(color);
    return hsl.lightness > 0.6; // Too light for good white text contrast
  }

  /// Check if a color is vibrant (high saturation)
  static bool _isVibrant(Color color) {
    final hsl = HSLColor.fromColor(color);
    return hsl.saturation > 0.5; // High saturation = vibrant
  }

  /// Check if a color is dark enough
  static bool _isDark(Color color) {
    final hsl = HSLColor.fromColor(color);
    return hsl.lightness < 0.7; // Dark enough for good contrast
  }

  /// Check if a color is close to a primary color (red, blue, green, yellow, orange, purple)
  static bool _isPrimaryColor(Color color) {
    final hsl = HSLColor.fromColor(color);
    final hue = hsl.hue;
    final saturation = hsl.saturation;
    
    // Only consider colors with decent saturation as primary
    if (saturation < 0.3) return false;
    
    // Define primary color ranges in HSL
    // Red: 0-30 and 330-360
    if ((hue >= 0 && hue <= 30) || (hue >= 330 && hue <= 360)) return true;
    // Orange: 30-60
    if (hue >= 30 && hue <= 60) return true;
    // Yellow: 60-90
    if (hue >= 60 && hue <= 90) return true;
    // Green: 90-150
    if (hue >= 90 && hue <= 150) return true;
    // Blue: 150-270
    if (hue >= 150 && hue <= 270) return true;
    // Purple: 270-330
    if (hue >= 270 && hue <= 330) return true;
    
    return false;
  }

  /// Check if a color is abundant in the palette (appears multiple times)
  static bool _isAbundantColor(Color color, List<Color> allColors) {
    // Count how many times this color (or very similar colors) appear
    int count = 0;
    for (final otherColor in allColors) {
      if (_colorsAreSimilar(color, otherColor)) {
        count++;
      }
    }
    return count >= 2; // Consider abundant if appears 2+ times
  }

  /// Check if two colors are similar (within a threshold)
  static bool _colorsAreSimilar(Color color1, Color color2) {
    final hsl1 = HSLColor.fromColor(color1);
    final hsl2 = HSLColor.fromColor(color2);
    
    final hueDiff = (hsl1.hue - hsl2.hue).abs();
    final normalizedHueDiff = math.min(hueDiff, 360 - hueDiff);
    final saturationDiff = (hsl1.saturation - hsl2.saturation).abs();
    final lightnessDiff = (hsl1.lightness - hsl2.lightness).abs();
    
    // Colors are similar if hue difference < 30 degrees and saturation/lightness differences < 0.3
    return normalizedHueDiff < 30 && saturationDiff < 0.3 && lightnessDiff < 0.3;
  }

  /// Calculate color harmony between two colors
  static double calculateColorHarmony(Color color1, Color color2) {
    final hsl1 = HSLColor.fromColor(color1);
    final hsl2 = HSLColor.fromColor(color2);
    
    // Calculate hue difference (0-180 degrees)
    final hueDiff = (hsl1.hue - hsl2.hue).abs();
    final normalizedHueDiff = math.min(hueDiff, 360 - hueDiff) / 180.0;
    
    // Calculate saturation similarity
    final saturationDiff = (hsl1.saturation - hsl2.saturation).abs();
    
    // Calculate lightness similarity
    final lightnessDiff = (hsl1.lightness - hsl2.lightness).abs();
    
    // Weighted harmony score (lower is better harmony)
    final harmonyScore = (normalizedHueDiff * 0.5) + (saturationDiff * 0.3) + (lightnessDiff * 0.2);
    
    return 1.0 - harmonyScore; // Convert to 0-1 scale where 1 is perfect harmony
  }

  /// Blend two colors with understanding of their relationship
  static Color blendColorsIntelligently(Color color1, Color color2, double ratio) {
    final harmony = calculateColorHarmony(color1, color2);
    
    // If colors have good harmony, blend normally
    if (harmony > 0.7) {
      return Color.lerp(color1, color2, ratio) ?? color1;
    }
    
    // If colors clash, create a more neutral intermediate
    final hsl1 = HSLColor.fromColor(color1);
    final hsl2 = HSLColor.fromColor(color2);
    
    // Create a neutral intermediate hue
    final intermediateHue = (hsl1.hue + hsl2.hue) / 2;
    final intermediateSaturation = (hsl1.saturation + hsl2.saturation) / 2 * 0.7; // Reduce saturation
    final intermediateLightness = (hsl1.lightness + hsl2.lightness) / 2;
    
    final intermediateColor = HSLColor.fromAHSL(
      (color1.alpha + color2.alpha) / 2 / 255.0,
      intermediateHue,
      intermediateSaturation,
      intermediateLightness,
    ).toColor();
    
    // Blend with the intermediate color
    final blend1 = Color.lerp(color1, intermediateColor, ratio * 0.5) ?? color1;
    final blend2 = Color.lerp(blend1, color2, ratio) ?? blend1;
    
    return blend2;
  }

  /// Generate organic shape points for a splash
  static List<Offset> generateOrganicShape(
    Offset center,
    double radius,
    double irregularity,
    math.Random random,
  ) {
    final points = <Offset>[];
    final numPoints = 8 + random.nextInt(8); // 8-15 points for organic feel
    
    for (int i = 0; i < numPoints; i++) {
      final angle = (i / numPoints) * 2 * math.pi;
      
      // Add irregularity to the radius
      final irregularRadius = radius * (0.7 + random.nextDouble() * 0.6);
      
      // Add noise to the angle for organic shape
      final noiseAngle = angle + (random.nextDouble() - 0.5) * irregularity * 0.5;
      
      // Add some randomness to the position
      final x = center.dx + math.cos(noiseAngle) * irregularRadius;
      final y = center.dy + math.sin(noiseAngle) * irregularRadius;
      
      points.add(Offset(x, y));
    }
    
    return points;
  }

  /// Darken a color to ensure good contrast with white text
  static Color _darkenForTextContrast(Color color) {
    final hsl = HSLColor.fromColor(color);
    return hsl.withLightness(math.min(0.6, hsl.lightness * 0.8)).toColor();
  }

  /// Extract the 3 most dominant colors from an image, prioritizing non-white colors
  /// but including white as an accent if present in the album art
  static Future<List<Color>> extractTop3Colors(ImageProvider imageProvider) async {
    try {
      // Use a much smaller size for faster processing
      // 200x200 is sufficient for accurate color extraction while being much faster
      const targetSize = Size(200, 200);
      
      print('🔍 Analyzing image at reduced resolution: ${targetSize.width.toInt()}x${targetSize.height.toInt()} pixels for faster processing');
      final palette = await PaletteGenerator.fromImageProvider(
        imageProvider,
        size: targetSize, // Use smaller size for faster processing
      );
      
      // Separate colors by type and quality
      final vibrantColors = <Color>[];
      final darkColors = <Color>[];
      final otherColors = <Color>[];
      final whiteColors = <Color>[];
      
      // Collect all available colors and categorize them
      final allColors = [
        palette.dominantColor?.color,
        palette.vibrantColor?.color,
        palette.mutedColor?.color,
        palette.lightVibrantColor?.color,
        palette.darkVibrantColor?.color,
        palette.lightMutedColor?.color,
        palette.darkMutedColor?.color,
      ].where((color) => color != null).cast<Color>();
      
      for (final color in allColors) {
        if (_isWhiteish(color)) {
          whiteColors.add(color);
        } else if (_isVibrant(color)) {
          // Prioritize vibrant colors (even if not super dark)
          vibrantColors.add(color);
        } else if (_isDark(color)) {
          // Dark but not necessarily vibrant
          darkColors.add(color);
        } else {
          // Other colors - process for contrast
          final processedColor = _isTooLight(color) 
              ? _darkenForTextContrast(color)
              : color;
          otherColors.add(processedColor);
        }
      }
      
      // Remove duplicates and prepare color lists
      final uniqueVibrant = vibrantColors.toSet().toList();
      final uniqueDark = darkColors.toSet().toList();
      final uniqueOther = otherColors.toSet().toList();
      final uniqueWhite = whiteColors.toSet().toList();
      
      // Sort vibrant colors by saturation (higher saturation first)
      uniqueVibrant.sort((a, b) {
        final saturationA = HSLColor.fromColor(a).saturation;
        final saturationB = HSLColor.fromColor(b).saturation;
        return saturationB.compareTo(saturationA); // Higher saturation first
      });
      
      // Sort dark colors by darkness (darker colors first)
      uniqueDark.sort((a, b) {
        final lightnessA = HSLColor.fromColor(a).lightness;
        final lightnessB = HSLColor.fromColor(b).lightness;
        return lightnessA.compareTo(lightnessB); // Lower lightness = darker
      });
      
      final result = <Color>[];
      
      // Prioritize vibrant colors first, then dark colors, then others
      result.addAll(uniqueVibrant.take(3)); // Take up to 3 vibrant colors
      if (result.length < 4) {
        result.addAll(uniqueDark.take(4 - result.length));
      }
      if (result.length < 4) {
        result.addAll(uniqueOther.take(4 - result.length));
      }
      
      // Check for abundant primary colors that might have been missed
      final abundantPrimaryColors = <Color>[];
      for (final color in allColors) {
        if (_isPrimaryColor(color) && 
            _isAbundantColor(color, allColors.toList()) &&
            !result.any((selectedColor) => _colorsAreSimilar(color, selectedColor))) {
          abundantPrimaryColors.add(color);
        }
      }
      
      // Add abundant primary colors if we have space
      if (abundantPrimaryColors.isNotEmpty && result.length < 5) {
        result.addAll(abundantPrimaryColors.take(5 - result.length));
        print('🎨 Added ${abundantPrimaryColors.length} abundant primary colors: ${abundantPrimaryColors.map((c) => c.toString()).join(', ')}');
      }
      
      print('🎨 Extracted ${uniqueVibrant.length} vibrant, ${uniqueDark.length} dark, ${uniqueOther.length} other, ${uniqueWhite.length} white colors');
      print('🎨 Selected top colors: ${result.map((c) => c.toString()).join(', ')}');
      
      // If we have less than 3 colors, fill with variations
      while (result.length < 3) {
        if (result.isNotEmpty) {
          // Create variations of existing colors
          final baseColor = result.first;
          final variation = Color.fromARGB(
            baseColor.alpha,
            (baseColor.red + 30) % 255,
            (baseColor.green + 30) % 255,
            (baseColor.blue + 30) % 255,
          );
          if (!_isWhiteish(variation)) {
            result.add(variation);
          } else {
            // If variation is white-ish, try a different approach
            final hsl = HSLColor.fromColor(baseColor);
            final newHue = (hsl.hue + 60) % 360;
            final newColor = HSLColor.fromAHSL(
              baseColor.alpha / 255.0,
              newHue,
              math.max(0.3, hsl.saturation),
              math.max(0.2, math.min(0.8, hsl.lightness)),
            ).toColor();
            result.add(newColor);
          }
        } else {
          // Fallback colors (no white-ish colors)
          result.addAll([
            const Color(0xFF8B7ED8),
            const Color(0xFFC7A2DB),
            const Color(0xFFBD9DFA),
          ]);
        }
      }
      
      // If we have white colors available and we have space, add one as accent
      if (uniqueWhite.isNotEmpty && result.length < 4) {
        // Add white as a subtle accent (lower opacity)
        final whiteAccent = uniqueWhite.first.withOpacity(0.3);
        result.add(whiteAccent);
      }
      
      return result.take(4).toList(); // Allow up to 4 colors (3 main + 1 white accent)
    } catch (e) {
      // Return default colors if extraction fails
      return [
        const Color(0xFF8B7ED8),
        const Color(0xFFC7A2DB),
        const Color(0xFFBD9DFA),
      ];
    }
  }

  /// Extract a color scheme from an image provider (legacy method)
  static Future<ColorScheme> extractColorsFromImage(ImageProvider imageProvider) async {
    try {
      final palette = await PaletteGenerator.fromImageProvider(
        imageProvider,
        size: const Size(200, 200), // Small size for fast processing
      );
      
      return ColorScheme(
        brightness: Brightness.dark,
        primary: palette.dominantColor?.color ?? const Color(0xFF8B7ED8),
        onPrimary: Colors.white,
        secondary: palette.vibrantColor?.color ?? const Color(0xFFC7A2DB),
        onSecondary: Colors.white,
        tertiary: palette.mutedColor?.color ?? const Color(0xFFBD9DFA),
        onTertiary: Colors.white,
        surface: palette.lightVibrantColor?.color ?? const Color(0xFFE0B9BE),
        onSurface: Colors.white,
        error: palette.darkVibrantColor?.color ?? const Color(0xFF6B46C1),
        onError: Colors.white,
      );
    } catch (e) {
      // Return default colors if extraction fails
      return const ColorScheme(
        brightness: Brightness.dark,
        primary: Color(0xFF8B7ED8),
        onPrimary: Colors.white,
        secondary: Color(0xFFC7A2DB),
        onSecondary: Colors.white,
        tertiary: Color(0xFFBD9DFA),
        onTertiary: Colors.white,
        surface: Color(0xFFE0B9BE),
        onSurface: Colors.white,
        error: Color(0xFF6B46C1),
        onError: Colors.white,
      );
    }
  }
  
  /// Extract colors from a network image URL
  static Future<ColorScheme> extractColorsFromUrl(String imageUrl) async {
    return extractColorsFromImage(NetworkImage(imageUrl));
  }

  /// Extract top 3 colors from a network image URL
  static Future<List<Color>> extractTop3ColorsFromUrl(String imageUrl) async {
    return extractTop3Colors(NetworkImage(imageUrl));
  }

  /// Generate random positions for colors on screen with animation properties
  static List<ColorPosition> generateRandomColorPositions(
    List<Color> colors, 
    Size screenSize,
  ) {
    final random = math.Random();
    final positions = <ColorPosition>[];
    
    // Create more splashes - 2-3 per color for better coverage
    final splashesPerColor = 2 + random.nextInt(2); // 2-3 splashes per color
    final totalSplashes = colors.length * splashesPerColor;
    
    // Track which colors have been used to ensure all colors get at least one splash
    final usedColors = <int>{};
    
    for (int i = 0; i < totalSplashes; i++) {
      final colorIndex = i % colors.length;
      final color = colors[colorIndex];
      final isWhiteAccent = _isWhiteish(color);
      final isPrimaryColor = _isPrimaryColor(color);
      
      // Ensure primary colors get at least one splash
      if (isPrimaryColor && !usedColors.contains(colorIndex)) {
        usedColors.add(colorIndex);
      }
      
      // Generate random position with better distribution
      // Add some margin from edges to avoid clipping
      final margin = 50.0;
      final x = margin + random.nextDouble() * (screenSize.width - 2 * margin);
      final y = margin + random.nextDouble() * (screenSize.height - 2 * margin);
      
      // Generate size based on whether it's a white accent or main color
      final minRadius = isWhiteAccent 
          ? math.min(screenSize.width, screenSize.height) * 0.1  // Smaller for white accent
          : math.min(screenSize.width, screenSize.height) * 0.15; // Slightly smaller for more splashes
      final maxRadius = isWhiteAccent
          ? math.min(screenSize.width, screenSize.height) * 0.3  // Smaller max for white accent
          : math.min(screenSize.width, screenSize.height) * 0.6; // Smaller max for more splashes
      final radius = minRadius + random.nextDouble() * (maxRadius - minRadius);
      
      // Generate opacity - higher opacity for watercolor effect
      final opacity = isWhiteAccent
          ? 0.3 + random.nextDouble() * 0.3  // 0.3 to 0.6 for white accent
          : 0.5 + random.nextDouble() * 0.4; // 0.5 to 0.9 for main colors (higher for watercolor bleeding)
      
      // Generate random velocity for movement - white accents move slower
      final maxVelocity = isWhiteAccent ? 10.0 : 20.0; // Slower for white accent
      final velocityX = (random.nextDouble() - 0.5) * 2 * maxVelocity;
      final velocityY = (random.nextDouble() - 0.5) * 2 * maxVelocity;
      
      // Generate random rotation speed - white accents rotate slower
      final rotationSpeed = isWhiteAccent
          ? (random.nextDouble() - 0.5) * 2 * 0.2  // Slower rotation for white accent
          : (random.nextDouble() - 0.5) * 2 * 0.5; // Normal rotation for main colors
      
      // Generate irregularity for organic shapes
      final irregularity = 0.3 + random.nextDouble() * 0.4; // 0.3 to 0.7 irregularity
      
      // Generate organic shape points
      final shapePoints = generateOrganicShape(
        Offset(x, y),
        radius,
        irregularity,
        random,
      );
      
      final position = ColorPosition(
        color: color.withOpacity(opacity),
        center: Offset(x, y),
        radius: radius,
        velocity: Offset(velocityX, velocityY),
        rotationSpeed: rotationSpeed,
        shapePoints: shapePoints,
        irregularity: irregularity,
      );
      
      positions.add(position);
      
      // Debug logging
      print('🎨 Color ${i + 1}: ${color.toString()} at (${x.toStringAsFixed(1)}, ${y.toStringAsFixed(1)}) with radius ${radius.toStringAsFixed(1)}');
    }
    
    // Ensure all colors get at least one splash (especially primary colors)
    for (int colorIndex = 0; colorIndex < colors.length; colorIndex++) {
      if (!usedColors.contains(colorIndex)) {
        final color = colors[colorIndex];
        final isWhiteAccent = _isWhiteish(color);
        final isPrimaryColor = _isPrimaryColor(color);
        
        // Generate one more splash for this color
        final margin = 50.0;
        final x = margin + random.nextDouble() * (screenSize.width - 2 * margin);
        final y = margin + random.nextDouble() * (screenSize.height - 2 * margin);
        
        final minRadius = isWhiteAccent 
            ? math.min(screenSize.width, screenSize.height) * 0.1
            : math.min(screenSize.width, screenSize.height) * 0.15;
        final maxRadius = isWhiteAccent
            ? math.min(screenSize.width, screenSize.height) * 0.3
            : math.min(screenSize.width, screenSize.height) * 0.6;
        final radius = minRadius + random.nextDouble() * (maxRadius - minRadius);
        
        final opacity = isWhiteAccent
            ? 0.3 + random.nextDouble() * 0.3
            : 0.5 + random.nextDouble() * 0.4;
        
        final maxVelocity = isWhiteAccent ? 10.0 : 20.0;
        final velocityX = (random.nextDouble() - 0.5) * 2 * maxVelocity;
        final velocityY = (random.nextDouble() - 0.5) * 2 * maxVelocity;
        
        final rotationSpeed = isWhiteAccent
            ? (random.nextDouble() - 0.5) * 2 * 0.2
            : (random.nextDouble() - 0.5) * 2 * 0.5;
        
        final irregularity = 0.3 + random.nextDouble() * 0.4;
        final shapePoints = generateOrganicShape(
          Offset(x, y),
          radius,
          irregularity,
          random,
        );
        
        final position = ColorPosition(
          color: color.withOpacity(opacity),
          center: Offset(x, y),
          radius: radius,
          velocity: Offset(velocityX, velocityY),
          rotationSpeed: rotationSpeed,
          shapePoints: shapePoints,
          irregularity: irregularity,
        );
        
        positions.add(position);
        usedColors.add(colorIndex);
        
        print('🎨 Added extra splash for ${isPrimaryColor ? "PRIMARY" : ""} color: ${color.toString()}');
      }
    }
    
    return positions;
  }

  /// Create blended gradient from color positions
  static Gradient createBlendedGradient(
    List<ColorPosition> positions,
    Size screenSize,
  ) {
    if (positions.isEmpty) {
      return const RadialGradient(
        colors: [Color(0xFF8B7ED8), Color(0xFFC7A2DB), Color(0xFFBD9DFA)],
        radius: 2.0,
      );
    }
    
    // Create a very subtle base gradient without straight lines
    final baseColors = <Color>[];
    final baseStops = <double>[];
    
    // Sort positions by opacity to get the most prominent colors
    final sortedPositions = List<ColorPosition>.from(positions);
    sortedPositions.sort((a, b) => b.color.opacity.compareTo(a.color.opacity));
    
    // Take the top 3 most opaque colors for base
    final topColors = sortedPositions.take(3).map((p) => p.color).toList();
    
    if (topColors.length >= 2) {
      baseColors.addAll(topColors);
      baseStops.addAll([0.0, 0.5, 1.0]);
    } else {
      baseColors.addAll([const Color(0xFF8B7ED8), const Color(0xFFC7A2DB)]);
      baseStops.addAll([0.0, 1.0]);
    }
    
    // Use a very subtle radial gradient as base
    return RadialGradient(
      center: Alignment.center,
      radius: 2.0, // Large radius to avoid circular pattern
      colors: baseColors,
      stops: baseStops,
    );
  }
  
  /// Create a gradient from a color scheme
  static LinearGradient createGradientFromColorScheme(
    ColorScheme colorScheme, {
    AlignmentGeometry begin = Alignment.topLeft,
    AlignmentGeometry end = Alignment.bottomRight,
  }) {
    return LinearGradient(
      begin: begin,
      end: end,
      colors: [
        colorScheme.primary,
        colorScheme.secondary,
        colorScheme.tertiary,
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }
  
  /// Create a radial gradient from a color scheme
  static RadialGradient createRadialGradientFromColorScheme(
    ColorScheme colorScheme, {
    AlignmentGeometry center = Alignment.center,
    double radius = 1.0,
  }) {
    return RadialGradient(
      center: center,
      radius: radius,
      colors: [
        colorScheme.primary,
        colorScheme.secondary,
        colorScheme.tertiary,
      ],
      stops: const [0.0, 0.5, 1.0],
    );
  }
  
  /// Interpolate between two color schemes
  static ColorScheme interpolateColorSchemes(
    ColorScheme from,
    ColorScheme to,
    double t,
  ) {
    return ColorScheme(
      brightness: from.brightness,
      primary: Color.lerp(from.primary, to.primary, t) ?? from.primary,
      onPrimary: Color.lerp(from.onPrimary, to.onPrimary, t) ?? from.onPrimary,
      secondary: Color.lerp(from.secondary, to.secondary, t) ?? from.secondary,
      onSecondary: Color.lerp(from.onSecondary, to.onSecondary, t) ?? from.onSecondary,
      tertiary: Color.lerp(from.tertiary, to.tertiary, t) ?? from.tertiary,
      onTertiary: Color.lerp(from.onTertiary, to.onTertiary, t) ?? from.onTertiary,
      surface: Color.lerp(from.surface, to.surface, t) ?? from.surface,
      onSurface: Color.lerp(from.onSurface, to.onSurface, t) ?? from.onSurface,
      error: Color.lerp(from.error, to.error, t) ?? from.error,
      onError: Color.lerp(from.onError, to.onError, t) ?? from.onError,
    );
  }
}
