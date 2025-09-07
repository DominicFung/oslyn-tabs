import 'package:flutter/material.dart';

/// Data structure for chord-lyric pairs
class ChordLyricPair {
  final String chordLine;      // "G   D   C   G   D" (preserve all spacing)
  final String lyricLine;      // "Were creation suddenly" (preserve all spacing)
  final List<ChordPosition> chords;
  
  ChordLyricPair({
    required this.chordLine,
    required this.lyricLine,
    required this.chords,
  });
}

/// Individual chord position information
class ChordPosition {
  final String chordName;      // "G", "D", "C"
  final int charPosition;      // Character position (0, 4, 8, 12, 16)
  final bool isMinor;
  final String? decorator;     // "add9", "sus4", etc.
  
  ChordPosition({
    required this.chordName,
    required this.charPosition,
    required this.isMinor,
    this.decorator,
  });
}

/// Main renderer for chord-lyric pairs
class ChordLyricRenderer {
  static ChordLyricPair parseChordLyricPair(String chordLine, String lyricLine) {
    // DON'T trim - preserve all intentional spacing!
    final chords = <ChordPosition>[];
    
    // Debug: Print lengths to understand the issue
    print('🔍 ChordLyricPair Debug:');
    print('   Chord line length: ${chordLine.length}');
    print('   Lyric line length: ${lyricLine.length}');
    print('   Chord line: "${chordLine}"');
    print('   Lyric line: "${lyricLine}"');
    
    // Skip if chord line is empty or only whitespace
    if (chordLine.trim().isEmpty) {
      return ChordLyricPair(
        chordLine: chordLine,
        lyricLine: lyricLine,
        chords: chords,
      );
    }
    
    // Find all chord positions using regex
    final regex = RegExp(r'([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)');
    final matches = regex.allMatches(chordLine);
    
    for (final match in matches) {
      final chordText = match.group(1)!;
      final charPosition = match.start;  // Character position in chord line (including leading spaces)
      
      // Map chord position to corresponding lyric position
      final lyricPosition = _mapChordToLyricPosition(charPosition, chordLine, lyricLine);
      
      // Debug: Print chord positioning
      print('   Chord: $chordText at position $charPosition in chord line');
      print('   Mapped to position $lyricPosition in lyric line');
      if (lyricPosition < lyricLine.length) {
        print('   Above character: "${lyricLine[lyricPosition]}"');
      }
      
      chords.add(ChordPosition(
        chordName: chordText,  // Keep the FULL chord name (Cadd9, Dm7, Gsus4, etc.)
        charPosition: lyricPosition,
        isMinor: _isMinorChord(chordText),
        decorator: _extractDecorator(chordText),
      ));
    }
    
    return ChordLyricPair(
      chordLine: chordLine,      // Preserve original spacing
      lyricLine: lyricLine,      // Preserve original spacing
      chords: chords,
    );
  }
  
  /// Map chord position to lyric position, handling extended chords
  /// This preserves leading whitespace and maps chords to their intended positions
  static int _mapChordToLyricPosition(int chordPos, String chordLine, String lyricLine) {
    // Always map proportionally to preserve relative spacing
    // This handles cases where chord line is longer than lyric line
    final ratio = lyricLine.length / chordLine.length;
    final scaledPos = (chordPos * ratio).round();
    return scaledPos.clamp(0, lyricLine.length - 1);
  }
  
  static bool _isMinorChord(String chord) {
    final cleanChord = chord.split(RegExp(r'(sus|maj|min|aug|dim|add|\/)'))[0];
    return cleanChord.toLowerCase().endsWith('m');
  }
  
  static String _extractDecorator(String chord) {
    final match = RegExp(r'(sus|maj|min|aug|dim|add|7|9|11|13)').firstMatch(chord);
    return match?.group(1) ?? '';
  }
  
  /// Render the chord-lyric pair
  static Widget renderChordLyricLine(ChordLyricPair pair, {String? textSize}) {
    final fontSize = _getTextSize(textSize);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Chord line with character-level positioning
        if (pair.chords.isNotEmpty)
          Container(
            height: 32,
            child: Stack(
              children: pair.chords.map((chord) {
                // Scale character position to pixel position
                // Use chord line length if lyrics are empty, otherwise use lyric line length
                final referenceLength = pair.lyricLine.trim().isEmpty ? pair.chordLine.length : pair.lyricLine.length;
                final pixelPosition = _calculateChordPosition(chord.charPosition, referenceLength);
                
                return Positioned(
                  left: pixelPosition,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Color(0xFF1976D2).withValues(alpha: 0.15), // Light blue background
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: Color(0xFF1976D2).withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      chord.chordName,
                      style: TextStyle(
                        color: Color(0xFF1976D2), // Dark blue for chords
                        fontWeight: FontWeight.bold,
                        fontSize: fontSize,  // Use same size as lyrics
                        fontFamily: 'monospace',  // Essential for alignment!
                        shadows: [
                          Shadow(
                            color: Colors.white.withValues(alpha: 0.8),
                            blurRadius: 1,
                            offset: const Offset(0.5, 0.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        
        // Lyric line (preserve all spacing) - only show if there are lyrics
        if (pair.lyricLine.trim().isNotEmpty)
          Container(
            height: 48,
            child: Text(
              pair.lyricLine,  // No trimming!
              style: TextStyle(
                color: Color(0xFF4A148C), // Darker, more saturated purple for better contrast
                fontSize: fontSize,  // Use same size as chords
                fontFamily: 'monospace',  // Essential for alignment!
                fontWeight: FontWeight.w900, // Extra bold for maximum crispness
                letterSpacing: 0.5, // Slight spacing for better character definition
                shadows: [
                  Shadow(
                    color: Colors.white.withValues(alpha: 0.9),
                    blurRadius: 2,
                    offset: const Offset(1, 1),
                  ),
                  Shadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 0,
                    offset: const Offset(0.5, 0.5),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
  
  /// Get text size based on textSize parameter
  static double _getTextSize(String? textSize) {
    switch (textSize) {
      case 'text-xs':
        return 12.0;
      case 'text-sm':
        return 14.0;
      case 'text-base':
        return 16.0;
      case 'text-lg':
        return 18.0;
      case 'text-xl':
        return 20.0;
      case 'text-2xl':
        return 24.0;
      case 'text-3xl':
        return 30.0;
      case 'text-4xl':
        return 36.0;
      case 'text-5xl':
        return 48.0;
      case 'text-6xl':
        return 60.0;
      case 'text-7xl':
        return 72.0;
      case 'text-8xl':
        return 96.0;
      case 'text-9xl':
        return 128.0;
      default:
        return 20.0; // Default to text-xl
    }
  }
  
  /// Calculate pixel position from character position
  /// This ensures chords are properly scaled and don't overflow
  static double _calculateChordPosition(int charPosition, int lyricLength) {
    // Use a reasonable character width (adjust based on your font)
    const double charWidth = 8.0;
    
    // Ensure we don't overflow the available space
    final maxWidth = 800.0; // Maximum width for the chord line
    final calculatedPosition = charPosition * charWidth;
    
    // If the calculated position would overflow, scale it down
    if (calculatedPosition > maxWidth) {
      final scaleFactor = maxWidth / (lyricLength * charWidth);
      return charPosition * charWidth * scaleFactor;
    }
    
    return calculatedPosition;
  }
  
}
