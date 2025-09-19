import 'dart:ui';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'color_extractor.dart';

/// A widget that creates an abstract, artistic background based on album art colors
/// Uses heavy blur, color extraction, and random positioning for artistic effect
class DynamicBackground extends StatefulWidget {
  final String? albumArtUrl;
  final ImageProvider? albumArtProvider;
  final Widget child;
  final Duration animationDuration;
  final double blurIntensity;
  final double scaleFactor;
  final bool enableBlurredImage;
  final bool enableColorExtraction;

  const DynamicBackground({
    super.key,
    this.albumArtUrl,
    this.albumArtProvider,
    required this.child,
    this.animationDuration = const Duration(milliseconds: 2000),
    this.blurIntensity = 50.0, // Much heavier blur
    this.scaleFactor = 2.0, // Larger scale
    this.enableBlurredImage = true,
    this.enableColorExtraction = true,
  });

  @override
  State<DynamicBackground> createState() => _DynamicBackgroundState();
}

class _DynamicBackgroundState extends State<DynamicBackground>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late AnimationController _movementController;
  late Animation<double> _blurAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _colorAnimation;
  
  List<Color>? _currentColors;
  List<ColorPosition>? _currentPositions;
  List<ColorPosition>? _previousPositions;
  bool _isLoading = true;
  String? _error;
  Size? _screenSize;
  DateTime _lastUpdateTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _extractAndAnimateColors();
  }

  @override
  void didUpdateWidget(DynamicBackground oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Check if album art has changed
    if (oldWidget.albumArtUrl != widget.albumArtUrl ||
        oldWidget.albumArtProvider != widget.albumArtProvider) {
      _extractAndAnimateColors();
    }
  }

  void _setupAnimations() {
    _animationController = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    
    // Continuous movement controller
    _movementController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _blurAnimation = Tween<double>(
      begin: 0.0,
      end: widget.blurIntensity,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
    ));

    _colorAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.2, 1.0, curve: Curves.easeInOut),
    ));

    // Start continuous movement
    _movementController.repeat();
    _movementController.addListener(_updateMovement);
  }

  Future<void> _extractAndAnimateColors() async {
    if (!widget.enableColorExtraction) {
      _setDefaultColors();
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<Color> newColors;
      
      if (widget.albumArtUrl != null) {
        newColors = await ColorExtractor.extractTop3ColorsFromUrl(widget.albumArtUrl!);
      } else if (widget.albumArtProvider != null) {
        newColors = await ColorExtractor.extractTop3Colors(widget.albumArtProvider!);
      } else {
        _setDefaultColors();
        return;
      }

      setState(() {
        _previousPositions = _currentPositions;
        _currentColors = newColors;
        _isLoading = false;
      });

      // Generate new random positions
      if (_screenSize != null) {
        _currentPositions = ColorExtractor.generateRandomColorPositions(
          newColors, 
          _screenSize!,
        );
      }

      _animationController.forward();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      _setDefaultColors();
    }
  }

  void _setDefaultColors() {
    setState(() {
      _currentColors = const [
        Color(0xFF8B7ED8),
        Color(0xFFC7A2DB),
        Color(0xFFBD9DFA),
      ];
      _isLoading = false;
    });
    
    if (_screenSize != null) {
      _currentPositions = ColorExtractor.generateRandomColorPositions(
        _currentColors!,
        _screenSize!,
      );
    }
    
    _animationController.forward();
  }

  void _updateMovement() {
    if (_currentPositions == null || _screenSize == null) return;
    
    final now = DateTime.now();
    final deltaTime = now.difference(_lastUpdateTime).inMilliseconds / 1000.0;
    _lastUpdateTime = now;
    
    setState(() {
      _currentPositions = _currentPositions!.map((position) {
        var newPosition = position.updatePosition(deltaTime);
        
        // Bounce off screen edges
        var newCenter = newPosition.center;
        var newVelocity = newPosition.velocity;
        
        if (newCenter.dx < 0 || newCenter.dx > _screenSize!.width) {
          newVelocity = Offset(-newVelocity.dx, newVelocity.dy);
          newCenter = Offset(
            newCenter.dx < 0 ? 0 : _screenSize!.width,
            newCenter.dy,
          );
        }
        
        if (newCenter.dy < 0 || newCenter.dy > _screenSize!.height) {
          newVelocity = Offset(newVelocity.dx, -newVelocity.dy);
          newCenter = Offset(
            newCenter.dx,
            newCenter.dy < 0 ? 0 : _screenSize!.height,
          );
        }
        
        return newPosition.copyWith(
          center: newCenter,
          velocity: newVelocity,
        );
      }).toList();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _movementController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        _screenSize = Size(constraints.maxWidth, constraints.maxHeight);
        
        return AnimatedBuilder(
          animation: _animationController,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                gradient: _buildBlendedGradient(),
              ),
              child: Stack(
                children: [
                  // Custom painter for multiple color splashes
                  if (_currentPositions != null && _screenSize != null)
                    CustomPaint(
                      size: _screenSize!,
                      painter: _ColorSplashPainter(
                        positions: _currentPositions!,
                        screenSize: _screenSize!,
                      ),
                    ),
                  
                  // Heavily blurred album art background (very subtle)
                  if (widget.enableBlurredImage && _shouldShowBlurredImage())
                    _buildBlurredImage(),
                  
                  // Content overlay
                  Opacity(
                    opacity: _fadeAnimation.value,
                    child: widget.child,
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  bool _shouldShowBlurredImage() {
    return (widget.albumArtUrl != null || widget.albumArtProvider != null) &&
           !_isLoading &&
           _error == null;
  }

  Widget _buildBlurredImage() {
    return Positioned.fill(
      child: Opacity(
        opacity: 0.1, // Very subtle
        child: Transform.scale(
          scale: widget.scaleFactor,
          child: ImageFiltered(
            imageFilter: ImageFilter.blur(
              sigmaX: _blurAnimation.value,
              sigmaY: _blurAnimation.value,
            ),
            child: widget.albumArtUrl != null
                ? CachedNetworkImage(
                    imageUrl: widget.albumArtUrl!,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => const SizedBox.shrink(),
                    errorWidget: (context, url, error) => const SizedBox.shrink(),
                  )
                : Image(
                    image: widget.albumArtProvider!,
                    fit: BoxFit.cover,
                  ),
          ),
        ),
      ),
    );
  }

  Gradient _buildBlendedGradient() {
    if (_currentPositions == null || _screenSize == null) {
      return _getDefaultGradient();
    }

    // Always use current positions for movement animation
    // Only interpolate during color transitions
    if (_previousPositions == null || !_animationController.isAnimating) {
      return _createAnimatedGradient(_currentPositions!);
    }

    // Interpolate between previous and current positions during transitions
    final interpolatedPositions = _interpolateColorPositions(
      _previousPositions!,
      _currentPositions!,
      _colorAnimation.value,
    );

    return _createAnimatedGradient(interpolatedPositions);
  }

  Gradient _createAnimatedGradient(List<ColorPosition> positions) {
    if (positions.isEmpty) {
      return _getDefaultGradient();
    }
    
    // Create a subtle base gradient without straight lines
    // Use a very soft radial gradient as base, then let the splotches do the work
    final baseColors = <Color>[];
    final baseStops = <double>[];
    
    // Create a very subtle base gradient using the most prominent colors
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

  List<ColorPosition> _interpolateColorPositions(
    List<ColorPosition> from,
    List<ColorPosition> to,
    double t,
  ) {
    final result = <ColorPosition>[];
    
    // Handle empty lists
    if (from.isEmpty && to.isEmpty) {
      return result;
    }
    
    final maxLength = math.max(from.length, to.length);
    
    for (int i = 0; i < maxLength; i++) {
      final fromPos = i < from.length ? from[i] : (from.isNotEmpty ? from.last : _getDefaultColorPosition());
      final toPos = i < to.length ? to[i] : (to.isNotEmpty ? to.last : _getDefaultColorPosition());
      
      final interpolatedColor = Color.lerp(fromPos.color, toPos.color, t)!;
      final interpolatedCenter = Offset.lerp(fromPos.center, toPos.center, t)!;
      final interpolatedRadius = fromPos.radius + (toPos.radius - fromPos.radius) * t;
      
      result.add(ColorPosition(
        color: interpolatedColor,
        center: interpolatedCenter,
        radius: interpolatedRadius,
      ));
    }
    
    return result;
  }

  Gradient _getDefaultGradient() {
    return const LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [
        Color(0xFF8B7ED8),
        Color(0xFFC7A2DB),
        Color(0xFFBD9DFA),
      ],
      stops: [0.0, 0.5, 1.0],
    );
  }
}

/// Custom painter for rendering multiple color splashes
class _ColorSplashPainter extends CustomPainter {
  final List<ColorPosition> positions;
  final Size screenSize;

  _ColorSplashPainter({
    required this.positions,
    required this.screenSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Create a separate canvas for blurring
    final recorder = PictureRecorder();
    final blurCanvas = Canvas(recorder);
    
    for (final position in positions) {
      if (position.shapePoints.isEmpty) {
        // Fallback to circle if no shape points - use solid color instead of radial gradient
        final centerX = position.center.dx;
        final centerY = position.center.dy;
        final radius = position.radius;
        
        final paint = Paint()
          ..color = position.color
          ..style = PaintingStyle.fill;

        blurCanvas.drawCircle(
          Offset(centerX, centerY),
          radius,
          paint,
        );
      } else {
        // Draw organic shape
        _drawOrganicShape(blurCanvas, position, size);
      }
    }
    
    // Convert the recorded picture to an image
    final picture = recorder.endRecording();
    final image = picture.toImageSync(size.width.toInt(), size.height.toInt());
    
    // Create multiple watercolor layers with different blur levels
    // Layer 1: Heavy blur for base watercolor effect
    final baseBlur = ImageFilter.blur(sigmaX: 40.0, sigmaY: 40.0);
    final basePaint = Paint()..imageFilter = baseBlur;
    canvas.drawImage(image, Offset.zero, basePaint);
    
    // Layer 2: Even heavier blur for watercolor bleeding
    final bleedBlur = ImageFilter.blur(sigmaX: 80.0, sigmaY: 80.0);
    final bleedPaint = Paint()
      ..imageFilter = bleedBlur
      ..colorFilter = ColorFilter.mode(
        Colors.white.withOpacity(0.2), 
        BlendMode.overlay,
      );
    canvas.drawImage(image, Offset.zero, bleedPaint);
    
    // Layer 3: Extreme blur for soft watercolor wash
    final washBlur = ImageFilter.blur(sigmaX: 120.0, sigmaY: 120.0);
    final washPaint = Paint()
      ..imageFilter = washBlur
      ..colorFilter = ColorFilter.mode(
        Colors.white.withOpacity(0.15), 
        BlendMode.softLight,
      );
    canvas.drawImage(image, Offset.zero, washPaint);
    
    // Clean up
    image.dispose();
    picture.dispose();
  }

  void _drawOrganicShape(Canvas canvas, ColorPosition position, Size size) {
    if (position.shapePoints.length < 3) return;

    final path = Path();
    
    // Start from the first point
    path.moveTo(position.shapePoints.first.dx, position.shapePoints.first.dy);
    
    // Create smooth curves between points for organic feel
    for (int i = 1; i < position.shapePoints.length; i++) {
      final current = position.shapePoints[i];
      
      // Calculate control points for smooth curves
      final controlPoint1 = Offset(
        (position.shapePoints[i - 1].dx + current.dx) / 2,
        (position.shapePoints[i - 1].dy + current.dy) / 2,
      );
      
      path.quadraticBezierTo(
        controlPoint1.dx,
        controlPoint1.dy,
        current.dx,
        current.dy,
      );
    }
    
    // Close the path
    path.close();
    
    // Use a simple solid color instead of radial gradient to avoid circular effects
    final paint = Paint()
      ..color = position.color
      ..style = PaintingStyle.fill;

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return oldDelegate is! _ColorSplashPainter ||
        oldDelegate.positions != positions ||
        oldDelegate.screenSize != screenSize;
  }
}

// Helper method to create a default ColorPosition when lists are empty
ColorPosition _getDefaultColorPosition() {
  return ColorPosition(
    color: const Color(0xFF8B7ED8), // Default purple color
    center: const Offset(0.5, 0.5), // Center of screen
    radius: 100.0, // Default radius
  );
}
