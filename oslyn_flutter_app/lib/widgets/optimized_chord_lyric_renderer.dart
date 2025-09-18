import 'package:flutter/material.dart';

/// Optimized chord-lyric renderer with simplified logic and better performance
class OptimizedChordLyricRenderer {
  // Cache for text measurements to avoid repeated TextPainter calculations
  static final Map<String, double> _textWidthCache = {};
  static final Map<String, double> _charWidthCache = {};
  
  /// Data structure for chord-lyric pairs
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
  
  /// Simplified chord positioning - no complex collision detection
  static List<Widget> _buildChordPositions(ChordLyricPair pair, double fontSize) {
    final List<Widget> chordWidgets = [];
    
    // Pre-calculate styling
    final vPad = (fontSize * 0.06).clamp(0.25, 2.5);
    final hPad = (fontSize * 0.16).clamp(2.0, 7.0);
    final bubbleRadius = (fontSize * 0.22).clamp(3.0, 5.0);
    
    // Get cached character width
    final charWidth = _getCachedCharWidth(fontSize);
    
    for (final chord in pair.chords) {
      // Simple positioning: map chord position directly to lyric position
      final lyricPosition = chord.charPosition.clamp(0, pair.lyricLine.length - 1);
      final pixelPosition = lyricPosition * charWidth;
      
      chordWidgets.add(
        Positioned(
          left: pixelPosition,
          child: _buildChordChip(chord.chordName, vPad, hPad, bubbleRadius, fontSize),
        ),
      );
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
      child: Text(
        text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          fontFamily: '.SF Pro Text',
          fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
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
    );
  }
  
  /// Get cached character width to avoid repeated TextPainter calculations
  static double _getCachedCharWidth(double fontSize) {
    final cacheKey = 'char_width_${fontSize.toStringAsFixed(1)}';
    
    if (_charWidthCache.containsKey(cacheKey)) {
      return _charWidthCache[cacheKey]!;
    }
    
    final painter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.left,
    );
    painter.text = TextSpan(
      text: 'M', // Use 'M' as average character width
      style: TextStyle(
        fontSize: fontSize,
        fontWeight: FontWeight.w900,
        fontFamily: '.SF Pro Text',
        fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
        letterSpacing: 0.3,
      ),
    );
    painter.layout();
    
    final charWidth = painter.width;
    _charWidthCache[cacheKey] = charWidth;
    return charWidth;
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
