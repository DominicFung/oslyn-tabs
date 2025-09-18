import 'package:flutter/material.dart';

/// Optimized chord-lyric renderer with simplified logic and better performance
class ChordLyricRenderer {
  // Cache for text measurements to avoid repeated TextPainter calculations
  static final Map<String, double> _textWidthCache = {};
  static final Map<String, double> _charWidthCache = {};
  
  /// Enable page-level snapping logs (triggered by SlidesWidget)
  static bool debugSnapping = false; // Disabled by default for performance
  /// Suppress noisy per-build renderer logs by default
  static bool debugRenderLogs = false; // Disabled by default for performance

  /// Turn on/off snapping logs at runtime
  static void setDebugSnapping(bool value) {
    debugSnapping = value;
  }

  static ChordLyricPair parseChordLyricPair(String chordLine, String lyricLine) {
    if (chordLine.trim().isEmpty) {
      return ChordLyricPair(
        chordLine: chordLine,
        lyricLine: lyricLine,
        chords: [],
      );
    }
    
    final chords = <ChordPosition>[];
    final regex = RegExp(r'([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)');
    final matches = regex.allMatches(chordLine);
    
    for (final match in matches) {
      final chordText = match.group(1)!;
      final charPosition = match.start;
      
      chords.add(ChordPosition(
        chordName: chordText,
        charPosition: charPosition,
        isMinor: _isMinorChord(chordText),
        decorator: _extractDecorator(chordText),
      ));
    }
    
    return ChordLyricPair(
      chordLine: chordLine,
      lyricLine: lyricLine,
      chords: chords,
    );
  }
  
  /// Precise chord positioning using efficient incremental width calculations with minimum spacing
  static List<Widget> _buildChordPositions(ChordLyricPair pair, double fontSize) {
    final List<Widget> chordWidgets = [];
    
    // Pre-calculate styling
    final vPad = (fontSize * 0.06).clamp(0.25, 2.5);
    final hPad = (fontSize * 0.16).clamp(2.0, 7.0);
    final bubbleRadius = (fontSize * 0.22).clamp(3.0, 5.0);
    
    // Calculate minimum spacing between chords (scales with font size)
    final minSpacing = (fontSize * 0.3).clamp(4.0, 12.0);
    
    // DEBUG: Log positioning calculations
    print('🎯 CHORD POSITIONING: "${pair.lyricLine.trim()}" (min spacing: ${minSpacing.toStringAsFixed(1)}px)');
    
    // Sort chords by position to enable incremental calculation
    final sortedChords = List<ChordPosition>.from(pair.chords);
    sortedChords.sort((a, b) => a.charPosition.compareTo(b.charPosition));
    
    // Calculate pixel positions incrementally with minimum spacing enforcement
    double lastPixelPosition = 0.0;
    int lastCharPosition = 0;
    double lastChordEndPosition = 0.0; // Track where the last chord box ends
    
    for (int i = 0; i < sortedChords.length; i++) {
      final chord = sortedChords[i];
      
      // Clamp position to valid range
      final lyricPosition = chord.charPosition.clamp(0, pair.lyricLine.length - 1);
      
      double pixelPosition;
      
      if (lyricPosition == lastCharPosition) {
        // Same position as previous chord - stack vertically with minimum spacing
        pixelPosition = lastPixelPosition;
      } else if (lyricPosition > lastCharPosition) {
        // Calculate incrementally from the last position
        final textToMeasure = pair.lyricLine.substring(lastCharPosition, lyricPosition);
        final incrementalWidth = _calculateTextWidth(textToMeasure, fontSize);
        pixelPosition = lastPixelPosition + incrementalWidth;
      } else {
        // Position is before the last one (shouldn't happen with sorted chords, but fallback)
        pixelPosition = _calculateExactPixelPosition(pair.lyricLine, lyricPosition, fontSize);
      }
      
      // Enforce minimum spacing from the previous chord's text end position
      if (i > 0) {
        final requiredMinPosition = lastChordEndPosition + minSpacing;
        if (pixelPosition < requiredMinPosition) {
          pixelPosition = requiredMinPosition;
        }
      }
      
      // Calculate the width of this chord text (without padding) for spacing calculations
      final chordText = chord.chordName;
      final chordTextWidth = _calculateTextWidth(chordText, fontSize);
      final bubbleWidth = chordTextWidth + (hPad * 2); // Full bubble width including padding
      final chordEndPosition = pixelPosition + chordTextWidth; // Use text width for spacing, not bubble width
      
      // Position the bubble so that the chord text aligns with the lyrics
      // The bubble should start at (pixelPosition - hPad) so the text inside aligns at pixelPosition
      final bubblePosition = pixelPosition - hPad;
      
      // DEBUG: Log each chord's positioning with spacing info
      final charAtPos = lyricPosition < pair.lyricLine.length ? pair.lyricLine[lyricPosition] : '?';
      final textToMeasure = pair.lyricLine.substring(0, lyricPosition);
      final spacingFromLast = i > 0 ? (pixelPosition - lastChordEndPosition).toStringAsFixed(1) : 'N/A';
      print('   "${chord.chordName}" → pos $lyricPosition ("$charAtPos") → text at ${pixelPosition.toStringAsFixed(1)}px, bubble at ${bubblePosition.toStringAsFixed(1)}px (spacing: ${spacingFromLast}px)');
      print('     Text: "$textToMeasure|$charAtPos" (text width: ${chordTextWidth.toStringAsFixed(1)}px, bubble width: ${bubbleWidth.toStringAsFixed(1)}px)');
      
      chordWidgets.add(
        Positioned(
          left: bubblePosition,
          child: _buildChordChip(chord.chordName, vPad, hPad, bubbleRadius, fontSize),
        ),
      );
      
      // Update for next iteration
      lastPixelPosition = pixelPosition;
      lastCharPosition = lyricPosition;
      lastChordEndPosition = chordEndPosition;
    }
    
    return chordWidgets;
  }
  
  /// Build a chord chip widget
  static Widget _buildChordChip(String text, double vPad, double hPad, double radius, double fontSize) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: hPad, vertical: vPad),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Center(
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
            color: Colors.white,
            fontFamily: '.SF Pro Text',
            fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
            height: 1.0, // Tight line height for better vertical centering
          ).copyWith(
            shadows: [
              Shadow(
                color: Colors.white.withValues(alpha: 0.7),
                blurRadius: 0.5,
                offset: const Offset(0.25, 0.25),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  /// Calculate the exact pixel position by measuring each character individually
  static double _calculateExactPixelPosition(String text, int charPosition, double fontSize) {
    if (charPosition <= 0) return 0.0;
    
    // Cache key for this specific text and font size
    final cacheKey = '${text.substring(0, charPosition.clamp(0, text.length))}_${fontSize.toStringAsFixed(1)}';
    
    if (_textWidthCache.containsKey(cacheKey)) {
      return _textWidthCache[cacheKey]!;
    }
    
    // Measure the exact width of text up to the character position
    final textToMeasure = text.substring(0, charPosition.clamp(0, text.length));
    
    final pixelWidth = _calculateTextWidth(textToMeasure, fontSize);
    _textWidthCache[cacheKey] = pixelWidth;
    
    return pixelWidth;
  }
  
  /// Calculate text width with caching
  static double _calculateTextWidth(String text, double fontSize) {
    if (text.isEmpty) return 0.0;
    
    // Cache key for this specific text and font size
    final cacheKey = '${text}_${fontSize.toStringAsFixed(1)}';
    
    if (_textWidthCache.containsKey(cacheKey)) {
      return _textWidthCache[cacheKey]!;
    }
    
    final painter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.left,
    );
    painter.text = TextSpan(
      text: text,
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: FontWeight.w900,
        fontFamily: '.SF Pro Text',
        fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
        letterSpacing: 0.3,
      ),
    );
    painter.layout();
    
    final pixelWidth = painter.width;
    _textWidthCache[cacheKey] = pixelWidth;
    
    return pixelWidth;
  }
  
  /// Render the chord-lyric pair with optimized performance
  static Widget renderChordLyricLine(ChordLyricPair pair, {String? textSize, double? dynamicFontSize}) {
    final fontSize = textSize == 'dynamic' && dynamicFontSize != null 
        ? dynamicFontSize 
        : _getTextSize(textSize);
    
    // Pre-calculate styling
    final vPad = (fontSize * 0.06).clamp(0.25, 2.5);
    final hPad = (fontSize * 0.16).clamp(2.0, 7.0);
    final bubbleRadius = (fontSize * 0.22).clamp(3.0, 5.0);
    final bubbleHeight = ((fontSize * 1.15) + vPad * 2 + 1).clamp(fontSize + 3.0, double.infinity);
    final lyricHeight = (fontSize * 1.7).clamp(fontSize + 8.0, fontSize * 2.2);
    
    // DEBUG: Log height comparison
    print('📏 HEIGHT COMPARISON: fontSize=${fontSize.toStringAsFixed(1)}px, bubble=${bubbleHeight.toStringAsFixed(1)}px, lyric=${lyricHeight.toStringAsFixed(1)}px, bubble/lyric=${(bubbleHeight/lyricHeight).toStringAsFixed(2)}');
    
    // Chord-only line: use Row layout for better performance
    if (pair.lyricLine.trim().isEmpty && pair.chords.isNotEmpty) {
      return Center(
        child: SizedBox(
          height: bubbleHeight,
          child: Row(
            children: pair.chords.map((chord) => 
              Container(
                margin: const EdgeInsets.only(left: 8.0),
                child: _buildChordChip(chord.chordName, vPad, hPad, bubbleRadius, fontSize),
              )
            ).toList(),
          ),
        ),
      );
    }
    
    return Center(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Chord line with simplified positioning
          if (pair.chords.isNotEmpty)
            SizedBox(
              height: bubbleHeight,
              child: Stack(
                children: _buildChordPositions(pair, fontSize),
              ),
            ),
          
          // Lyric line
          if (pair.lyricLine.trim().isNotEmpty)
            SizedBox(
              height: lyricHeight,
              child: Text(
                pair.lyricLine,
                style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                  letterSpacing: 0.3,
                ),
              ),
            ),
        ],
      ),
    );
  }
  
  /// Get text size based on textSize parameter
  static double _getTextSize(String? textSize) {
    switch (textSize) {
      case 'text-xs': return 20.0;
      case 'text-sm': return 24.0;
      case 'text-base': return 28.0;
      case 'text-lg': return 32.0;
      case 'text-xl': return 40.0;
      case 'text-2xl': return 48.0;
      case 'text-3xl': return 64.0;
      case 'text-4xl': return 80.0;
      case 'text-5xl': return 96.0;
      case 'text-6xl': return 128.0;
      case 'text-7xl': return 160.0;
      case 'text-8xl': return 200.0;
      case 'text-9xl': return 256.0;
      default: return 28.0;
    }
  }
  
  static bool _isMinorChord(String chord) {
    final cleanChord = chord.split(RegExp(r'(sus|maj|min|aug|dim|add|\/)'))[0];
    return cleanChord.toLowerCase().endsWith('m');
  }
  
  static String _extractDecorator(String chord) {
    final match = RegExp(r'(sus|maj|min|aug|dim|add|7|9|11|13)').firstMatch(chord);
    return match?.group(1) ?? '';
  }
  

  /// Clear caches to free memory
  static void clearCaches() {
    _textWidthCache.clear();
    _charWidthCache.clear();
  }
}

/// Data structure for chord-lyric pairs
class ChordLyricPair {
  final String chordLine;
  final String lyricLine;
  final List<ChordPosition> chords;
  
  ChordLyricPair({
    required this.chordLine,
    required this.lyricLine,
    required this.chords,
  });
}

/// Individual chord position information
class ChordPosition {
  final String chordName;
  final int charPosition;
  final bool isMinor;
  final String? decorator;
  
  ChordPosition({
    required this.chordName,
    required this.charPosition,
    required this.isMinor,
    this.decorator,
  });
}