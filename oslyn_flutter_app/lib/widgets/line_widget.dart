import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import 'chord_lyric_renderer.dart';

/// Line widget for displaying lyrics with chords above
/// Based on the web app's slides line.tsx
class LineWidget extends StatelessWidget {
  final OslynPhrase phrase;
  final String? textSize;
  final Color? color;
  final String chordSheetKey;

  const LineWidget({
    super.key,
    required this.phrase,
    this.textSize,
    this.color,
    required this.chordSheetKey,
  });

  @override
  Widget build(BuildContext context) {
    // Show widget even if lyrics are empty, as long as there are chords
    if (phrase.lyric.trim().isEmpty && phrase.chords.isEmpty) {
      return const SizedBox.shrink();
    }

    // Convert OslynPhrase to ChordLyricPair for rendering
    final lyricLine = phrase.lyric;
    
    final chordLyricPair = ChordLyricPair(
      chordLine: phrase.chordLine, // Use the stored chord line text
      lyricLine: lyricLine,
      chords: phrase.chords.map((chord) {
        // Use the original chord name stored in the decorator field
        final displayName = chord.decorator.isNotEmpty ? chord.decorator : '?';
        
        return ChordPosition(
          chordName: displayName,
          charPosition: chord.position,
          isMinor: chord.isMinor,
          decorator: chord.decorator,
        );
      }).toList(),
    );

    return Container(
      margin: const EdgeInsets.only(top: 8), // Reduced top margin
      child: ChordLyricRenderer.renderChordLyricLine(chordLyricPair, textSize: textSize),
    );
  }
  



}
