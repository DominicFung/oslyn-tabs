import 'package:flutter/material.dart';
import '../models/oslyn_types.dart';
import '../core/oslyn_engine.dart';

/// Flutter implementation of the web app's Line component
/// Renders a single phrase with properly positioned chords above lyrics
class LineWidget extends StatefulWidget {
  final OslynPhrase phrase;
  final String songKey;
  final int transpose;
  final bool secondary;
  final double textSize;
  final bool decorate;

  const LineWidget({
    super.key,
    required this.phrase,
    required this.songKey,
    this.transpose = 0,
    this.secondary = false,
    this.textSize = 16.0,
    this.decorate = false,
  });

  @override
  State<LineWidget> createState() => _LineWidgetState();
}

class _LineWidgetState extends State<LineWidget> {
  late OslynPhrase _processedPhrase;
  late TextPainter _textPainter;

  @override
  void initState() {
    super.initState();
    _textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.left,
    );
    _processPhrase();
  }

  @override
  void didUpdateWidget(LineWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.phrase != widget.phrase ||
        oldWidget.textSize != widget.textSize ||
        oldWidget.decorate != widget.decorate) {
      _processPhrase();
    }
  }

  @override
  void dispose() {
    _textPainter.dispose();
    super.dispose();
  }

  /// Process the phrase using the same spacing algorithm as the web app
  void _processPhrase() {
    if (widget.phrase.lyric.trim().isEmpty) {
      _processedPhrase = widget.phrase;
      return;
    }

    _processedPhrase = _spacer(widget.phrase, widget.decorate, widget.textSize);
  }

  /// Flutter implementation of the web app's spacer algorithm
  OslynPhrase _spacer(OslynPhrase phrase, bool decorate, double textSize) {
    if (phrase.chords.length < 2) return phrase;

    const double pad = 10.0; // Space needed BETWEEN chords (same as web app's _PAD)
    double totalPad = 0.0;
    List<OslynChord> newChords = List.from(phrase.chords);
    String newLyric = phrase.lyric;

    for (int i = 1; i < newChords.length; i++) {
      newChords[i] = OslynChord(
        chord: newChords[i].chord,
        position: newChords[i].position + totalPad,
        isMinor: newChords[i].isMinor,
        decorator: newChords[i].decorator,
      );

      // Check if there's enough room between two chords (same logic as web app)
      String chord1 = _getChordText(newChords[i - 1], decorate);
      String chord2 = _getChordText(newChords[i], decorate);
      
      String lyricSubstring = newLyric.substring(
        newChords[i - 1].position,
        newChords[i].position,
      );

      double chordWidth = _calculateWidth(chord1, textSize) + pad;
      double textWidth = _calculateWidth(lyricSubstring, textSize);

      if (textWidth < chordWidth) {
        // Need to add spacing using the same priority system as web app
        String spacedLyric = _addSpacingToLyric(
          lyricSubstring,
          chordWidth - textWidth,
          textSize,
        );

        // Update the lyric with spacing
        newLyric = _substituteString(
          newLyric,
          spacedLyric,
          newChords[i - 1].position,
          newChords[i].position,
        );

        // Update chord positions
        double spaceAdded = _calculateWidth(spacedLyric, textSize) - textWidth;
        totalPad += spaceAdded;
        newChords[i] = OslynChord(
          chord: newChords[i].chord,
          position: newChords[i].position + spaceAdded,
          isMinor: newChords[i].isMinor,
          decorator: newChords[i].decorator,
        );
      }
    }

    return OslynPhrase(
      lyric: newLyric,
      chords: newChords,
      section: phrase.section,
    );
  }

  /// Add spacing to lyrics using the same priority system as web app
  String _addSpacingToLyric(String lyric, double neededSpace, double textSize) {
    // Priority 1: Find existing spaces and add non-breaking spaces (same as web app)
    List<int> spacePositions = _findAllOccurrences(' ', lyric);
    if (spacePositions.isNotEmpty) {
      return _addSpacingAtPositions(lyric, spacePositions, neededSpace, textSize, ' ');
    }

    // Priority 2: Find vowels and add " - " with spacing (same as web app)
    List<int> vowelPositions = _findVowels(lyric);
    if (vowelPositions.isNotEmpty) {
      return _addSpacingAtPositions(lyric, vowelPositions, neededSpace, textSize, '-');
    }

    // Priority 3: Add spacing in the middle (same as web app)
    int middle = lyric.length ~/ 2;
    return _addSpacingAtPositions(lyric, [middle], neededSpace, textSize, '-');
  }

  /// Add spacing at specific positions (same logic as web app)
  String _addSpacingAtPositions(
    String lyric,
    List<int> positions,
    double neededSpace,
    double textSize,
    String separator,
  ) {
    String result = lyric;
    double currentWidth = _calculateWidth(result, textSize);
    double targetWidth = currentWidth + neededSpace;
    int spacingMultiplier = 1;

    while (currentWidth < targetWidth) {
      String spacing = '\u00A0' * spacingMultiplier; // Non-breaking spaces (same as web app)
      String insertText = separator == ' ' ? spacing : '$spacing$separator$spacing';
      
      // Insert at the first position
      int pos = positions.first;
      result = result.substring(0, pos) + insertText + result.substring(pos);
      
      // Update positions for subsequent insertions
      for (int i = 1; i < positions.length; i++) {
        positions[i] += insertText.length;
      }
      
      currentWidth = _calculateWidth(result, textSize);
      spacingMultiplier++;
    }

    return result;
  }

  /// Find all occurrences of a substring in a string
  List<int> _findAllOccurrences(String substring, String string) {
    List<int> positions = [];
    int index = 0;
    while ((index = string.indexOf(substring, index)) != -1) {
      positions.add(index);
      index += substring.length;
    }
    return positions;
  }

  /// Find vowel positions in a string
  List<int> _findVowels(String str) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    List<int> positions = [];
    
    for (int i = 0; i < str.length; i++) {
      if (vowels.contains(str[i].toLowerCase())) {
        positions.add(i);
      }
    }
    return positions;
  }

  /// Substitute a substring in a string
  String _substituteString(String original, String replacement, int start, int end) {
    return original.substring(0, start) + replacement + original.substring(end);
  }

  /// Get the actual chord text from chord number
  String _getChordText(OslynChord chord, bool decorate) {
    String? chordName = OslynEngine.getChordByNumber(
      chord.chord,
      chord.isMinor,
      widget.songKey,
    );
    
    if (chordName == null) return '?';
    
    if (decorate && chord.decorator != null) {
      return '$chordName${chord.decorator}';
    }
    
    return chordName;
  }

  /// Calculate text width using Flutter's TextPainter (equivalent to web app's calculateWidth)
  double _calculateWidth(String text, double fontSize) {
    _textPainter.text = TextSpan(
      text: text,
      style: TextStyle(
        fontSize: fontSize,
        fontFamily: 'monospace',
      ),
    );
    _textPainter.layout();
    return _textPainter.width;
  }

  @override
  Widget build(BuildContext context) {
    if (_processedPhrase.lyric.trim().isEmpty) {
      return _buildChordOnlyLine();
    }

    return _buildChordAndLyricLine();
  }

  /// Build line with both chords and lyrics (using same positioning as web app)
  Widget _buildChordAndLyricLine() {
    return Container(
      height: 48, // Equivalent to h-12 in web
      child: Stack(
        children: [
          // Lyrics line (same positioning as web app)
          Positioned(
            left: 0,
            top: _getLineMargin(widget.textSize), // Use same margin calculation as web app
            child: Text(
              _processedPhrase.lyric,
              style: TextStyle(
                fontSize: widget.textSize,
                color: widget.secondary 
                    ? Theme.of(context).colorScheme.onSurface.withOpacity(0.6)
                    : Theme.of(context).colorScheme.onSurface,
                fontFamily: 'monospace',
              ),
            ),
          ),
          // Chord chips (using same positioning logic as web app)
          ..._processedPhrase.chords.map((chord) {
            String chordText = _getChordText(chord, widget.decorate);
            
            // Calculate width of text up to chord position (same as web app)
            double width = _calculateWidth(
              _processedPhrase.lyric.substring(0, chord.position),
              widget.textSize,
            );
            
            return Positioned(
              left: width, // Use calculated width directly (same as web app's marginLeft)
              top: _getChordTop(widget.textSize), // Use same top calculation as web app
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  color: widget.secondary
                      ? Theme.of(context).colorScheme.surfaceVariant
                      : Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  chordText,
                  style: TextStyle(
                    fontSize: widget.textSize * 0.9,
                    fontWeight: FontWeight.bold,
                    color: widget.secondary
                        ? Theme.of(context).colorScheme.onSurfaceVariant
                        : Theme.of(context).colorScheme.onPrimary,
                  ),
                ),
              ),
            );
          }).toList(),
        ],
      ),
    );
  }

  /// Build line with only chords (for chord-only lines, same logic as web app)
  Widget _buildChordOnlyLine() {
    return Container(
      height: 48,
      child: Row(
        children: _processedPhrase.chords.asMap().entries.map((entry) {
          int index = entry.key;
          OslynChord chord = entry.value;
          String chordText = _getChordText(chord, widget.decorate);
          
          // Same margin calculation as web app
          double marginLeft = 1.0;
          if (index > 0) {
            marginLeft += (chord.position - _processedPhrase.chords[index - 1].position) * 3;
          }
          
          return Container(
            margin: EdgeInsets.only(left: marginLeft),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
            decoration: BoxDecoration(
              color: widget.secondary
                  ? Theme.of(context).colorScheme.surfaceVariant
                  : Theme.of(context).colorScheme.primary,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              chordText,
              style: TextStyle(
                fontSize: widget.textSize * 0.9,
                fontWeight: FontWeight.bold,
                color: widget.secondary
                    ? Theme.of(context).colorScheme.onSurfaceVariant
                    : Theme.of(context).colorScheme.onPrimary,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  /// Get chord top position (equivalent to web app's hs[textSize].chordTop)
  double _getChordTop(double textSize) {
    // Map text sizes to chord top positions (same as web app)
    if (textSize <= 12) return -18;      // text-xs
    if (textSize <= 14) return -20;      // text-sm
    if (textSize <= 16) return -23;      // text-base
    if (textSize <= 18) return -26;      // text-lg
    if (textSize <= 20) return -28;      // text-xl
    if (textSize <= 24) return -30;      // text-2xl
    if (textSize <= 30) return -32;      // text-3xl
    if (textSize <= 36) return -36;      // text-4xl
    if (textSize <= 48) return -46;      // text-5xl
    if (textSize <= 60) return -56;      // text-6xl
    if (textSize <= 72) return -70;      // text-7xl
    if (textSize <= 96) return -88;      // text-8xl
    return -100;                          // text-9xl
  }

  /// Get line margin (equivalent to web app's hs[textSize].lineMargin)
  double _getLineMargin(double textSize) {
    // Map text sizes to line margins (same as web app)
    if (textSize <= 12) return 0;        // text-xs
    if (textSize <= 14) return 5;        // text-sm
    if (textSize <= 16) return 10;       // text-base
    if (textSize <= 18) return 15;       // text-lg
    if (textSize <= 20) return 20;       // text-xl
    if (textSize <= 24) return 25;       // text-2xl
    if (textSize <= 30) return 30;       // text-3xl
    if (textSize <= 36) return 40;       // text-4xl
    if (textSize <= 48) return 60;       // text-5xl
    if (textSize <= 60) return 80;       // text-6xl
    if (textSize <= 72) return 120;      // text-7xl
    if (textSize <= 96) return 170;      // text-8xl
    return 240;                           // text-9xl
  }
}
