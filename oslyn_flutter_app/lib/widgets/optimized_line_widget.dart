import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import '../core/oslyn_engine.dart';
import 'optimized_chord_lyric_renderer.dart';

/// Optimized line widget for displaying lyrics with chords above
/// Simplified version with better performance
class OptimizedLineWidget extends StatelessWidget {
  final OslynPhrase phrase;
  final String? textSize;
  final Color? color;
  final String chordSheetKey;
  final String? originalKey;
  final int capo;
  final double? dynamicFontSize;

  const OptimizedLineWidget({
    super.key,
    required this.phrase,
    this.textSize,
    this.color,
    required this.chordSheetKey,
    this.originalKey,
    this.capo = 0,
    this.dynamicFontSize,
  });

  /// Calculate the transposition offset between original key and current key
  int _getTranspositionOffset() {
    if (originalKey == null || originalKey == chordSheetKey) {
      return 0;
    }
    
    // Find the index of the original key
    int? originalIndex;
    for (int i = 0; i < OslynEngine.keyDistanceMap.length; i++) {
      if (OslynEngine.keyDistanceMap[i].contains(originalKey!)) {
        originalIndex = i;
        break;
      }
    }
    
    // Find the index of the current key
    int? currentIndex;
    for (int i = 0; i < OslynEngine.keyDistanceMap.length; i++) {
      if (OslynEngine.keyDistanceMap[i].contains(chordSheetKey)) {
        currentIndex = i;
        break;
      }
    }
    
    if (originalIndex == null || currentIndex == null) {
      return 0;
    }
    
    // Calculate the offset
    int offset = currentIndex - originalIndex;
    while (offset < 0) offset += 12;
    while (offset >= 12) offset -= 12;
    
    return offset;
  }

  @override
  Widget build(BuildContext context) {
    // Show widget even if lyrics are empty, as long as there are chords
    if (phrase.lyric.trim().isEmpty && phrase.chords.isEmpty) {
      return const SizedBox.shrink();
    }

    // Calculate transposition offset and apply capo adjustment
    final transposeOffset = (_getTranspositionOffset() + (capo % 12)) % 12;

    // Convert OslynPhrase to ChordLyricPair for rendering
    final lyricLine = ' ${phrase.lyric}        ';
    
    final chordLyricPair = ChordLyricPair(
      chordLine: ' ${phrase.chordLine}        ',
      lyricLine: lyricLine,
      chords: phrase.chords.map((chord) {
        final originalFullText = chord.decorator;
        final displayName = _transposeDecoratedChord(originalFullText, transposeOffset);
        
        return ChordPosition(
          chordName: displayName,
          charPosition: chord.position + 1, // Adjust for leading space padding
          isMinor: chord.isMinor,
          decorator: chord.decorator,
        );
      }).toList(),
    );

    return Container(
      margin: const EdgeInsets.only(top: 8),
      child: OptimizedChordLyricRenderer.renderChordLyricLine(
        chordLyricPair, 
        textSize: textSize,
        dynamicFontSize: dynamicFontSize,
      ),
    );
  }
}

/// Helpers to transpose full decorated chord text
extension _ChordTransposeHelpers on OptimizedLineWidget {
  String _transposeDecoratedChord(String chordText, int offset) {
    if (chordText.isEmpty) return chordText;

    // Transpose root at start
    final rootRegex = RegExp(r'^([A-Ga-g](?:##?|bb?))');
    String result = chordText;

    final rootMatch = rootRegex.firstMatch(result);
    if (rootMatch != null) {
      final root = rootMatch.group(1)!;
      final transposedRoot = _transposeNote(root, offset);
      if (transposedRoot != null) {
        result = transposedRoot + result.substring(root.length);
      }
    }

    // Transpose slash bass if present
    final slashRegex = RegExp(r'/(\s*)([A-Ga-g](?:##?|bb?))');
    result = result.replaceAllMapped(slashRegex, (m) {
      final spacing = m.group(1) ?? '';
      final bass = m.group(2)!;
      final transposedBass = _transposeNote(bass, offset) ?? bass;
      return '/$spacing$transposedBass';
    });

    return result;
  }

  String? _transposeNote(String note, int offset) {
    final normalized = note[0].toUpperCase() + (note.length > 1 ? note.substring(1) : '');

    int? index;
    for (int i = 0; i < OslynEngine.keyDistanceMap.length; i++) {
      if (OslynEngine.keyDistanceMap[i].contains(normalized)) {
        index = i;
        break;
      }
    }
    if (index == null) return null;

    int newIndex = (index + offset) % OslynEngine.keyDistanceMap.length;
    if (newIndex < 0) newIndex += OslynEngine.keyDistanceMap.length;
    return OslynEngine.keyDistanceMap[newIndex][0];
  }
}
