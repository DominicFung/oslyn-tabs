import 'oslyn_types.dart';

// Core Oslyn engine for processing chord sheets
// Based on the web app's oslyn.ts

class OslynEngine {
  // Chord regex patterns (inclusive of add/sus/maj/min/extensions and slash chords)
  static const String chordRegexForTextBlock =
      r"(^| |\n)([A-Ga-g](?:##?|bb?)?(?:m|M)?(?:maj|min|dim|aug|sus|add)?(?:[#b]?\d{0,2})*(?:\([^)]*\))?(?:\/[A-Ga-g](?:##?|bb?)?)?)(?=\n| |$)";
  static const String chordRegex =
      r"^([A-Ga-g](?:##?|bb?)?(?:m|M)?(?:maj|min|dim|aug|sus|add)?(?:[#b]?\d{0,2})*(?:\([^)]*\))?(?:\/[A-Ga-g](?:##?|bb?)?)?)$";
  static const String keyRegex = r"^[A-Ga-g](##?|bb?)?$";

  // Key distance map for transposition (same as web app)
  static const List<List<String>> keyDistanceMap = [
    ['A', 'G##', 'Bbb'],
    ['Bb', 'A#', 'Cbb'],
    ['B', 'Cb', 'A##'],
    ['C', 'B#'],
    ['C#', 'Db', 'B##'],
    ['D', 'C##', 'Ebb'],
    ['Eb', 'D#', 'Fbb'],
    ['E', 'Fb', 'D##'],
    ['F', 'E#', 'Gbb'],
    ['F#', 'Gb', 'E##'],
    ['G', 'F##', 'Abb'],
    ['Ab', 'G#'],
  ];

  /// Convert chord sheet to slides
  static OslynSlide chordSheetToSlides(String sheet, String key) {
    final song = _rawChordsheetToSectionJson(sheet);
    final oslynSong = _convertOslynSong(sheet, song, key);
    return _convertOslynSongToPages(oslynSong);
  }

  /// Get chord name by number (same logic as web app)
  static String? getChordByNumber(int chord, bool isMinor, String key) {
    if (!RegExp(keyRegex).hasMatch(key)) return null;
    
    for (int i = 0; i < keyDistanceMap.length; i++) {
      if (keyDistanceMap[i].contains(key)) {
        int index = (i + chord) % keyDistanceMap.length;
        return isMinor ? '${keyDistanceMap[index][0]}m' : keyDistanceMap[index][0];
      }
    }
    return null;
  }

  /// Determine line type
  static String getLineType(String line) {
    if (_isChordLine(line)) return 'chord';
    if (line.trim().replaceAll(RegExp(r'\s+'), ' ') == ' ') return 'blank';
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) return 'annotation';
    return 'lyric';
  }

  /// Check if chord is minor
  static bool getIsMinor(String chord) {
    final cleanChord = chord.split(RegExp(r'(sus|maj|min|aug|dim)'))[0];
    return cleanChord.toLowerCase().endsWith('m') || 
           cleanChord.toLowerCase().endsWith('m7');
  }

  // Private helper methods

  static bool _isChordLine(String line) {
    final tempLine = line.trim()
        .replaceAll(RegExp(r'[^a-zA-Z0-9#\/\s]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .split(' ');
    
    int numOfChords = 0;
    int numOfNonChords = 0;

    for (final item in tempLine) {
      if (RegExp(chordRegex).hasMatch(item)) {
        numOfChords++;
      } else {
        numOfNonChords++;
      }
    }

    return numOfChords >= numOfNonChords;
  }

  static String _getSectionName(String line) {
    final parts = line.split('[');
    if (parts.length < 2) return '';
    final lastPart = parts.last;
    final sectionParts = lastPart.split(']');
    return sectionParts.first;
  }

  /// Strip chord to key (same logic as web app)
  static String? _stripChordToKey(String chord) {
    final parts = chord.split(RegExp(r'(add|sus|maj|min|aug|dim|\/)'));
    final baseChord = parts.first;
    final cleanChord = baseChord.replaceAll(RegExp(r'(M|m)'), '');
    final finalChord = cleanChord.replaceAll(RegExp(r'[0-9]'), '');
    
    if (RegExp(keyRegex).hasMatch(finalChord)) {
      return finalChord;
    }
    return null;
  }

  /// Distance from key (same logic as web app)
  static int? _distanceFromKey(String chord, String key) {
    if (!RegExp(keyRegex).hasMatch(key)) return null;
    
    final schord = _stripChordToKey(chord);
    if (schord == null) return null;

    for (int i = 0; i < keyDistanceMap.length; i++) {
      if (keyDistanceMap[i].contains(key)) {
        int index = i;
        int p = 0;
        
        while (p < 12) {
          if (keyDistanceMap[index].contains(schord)) {
            return p;
          }
          if (index + 1 < keyDistanceMap.length) {
            index++;
          } else {
            index = 0;
          }
          p++;
        }
      }
    }
    return null;
  }

  // Real implementation of chord sheet parsing (based on web app)
  static Map<String, dynamic> _rawChordsheetToSectionJson(String sheet) {
    final lines = sheet.split('\n');
    final sections = <Map<String, dynamic>>[];
    String currentSection = 'Verse';
    
    for (final line in lines) {
      final trimmedLine = line.trim();
      if (trimmedLine.isEmpty) continue;
      
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        currentSection = _getSectionName(trimmedLine);
        sections.add({
          'name': currentSection,
          'chords': <Map<String, dynamic>>[],
        });
      } else if (getLineType(trimmedLine) == 'chord') {
        // Parse chord line
        final chordPositions = _parseChordLine(trimmedLine);
        if (sections.isNotEmpty) {
          sections.last['chords'].addAll(chordPositions);
        }
      }
    }
    
    // Ensure we have at least one section
    if (sections.isEmpty) {
      sections.add({
        'name': 'Verse',
        'chords': <Map<String, dynamic>>[],
      });
    }
    
    return {'sections': sections};
  }

  static List<Map<String, dynamic>> _parseChordLine(String line) {
    // Use the new _extractChordsFromLine method for consistency
    return _extractChordsFromLine(line);
  }

  /// Extract chords with positions from a line
  static List<Map<String, dynamic>> _extractChordsFromLine(String line) {
    final chords = <Map<String, dynamic>>[];
    // Capture full chord tokens starting with a root note, including sus/add/maj/min, numbers, parentheses, and slash bass
    final regex = RegExp(r'([A-Ga-g](?:##?|bb?)?(?:m|M)?(?:maj|min|dim|aug|sus|add)?(?:[#b]?\d{0,2})*(?:\([^)]*\))?(?:\/[A-Ga-g](?:##?|bb?)?)?)');
    final matches = regex.allMatches(line);
    
    for (final match in matches) {
      final chordText = match.group(1)!;
      final charPosition = match.start;
      
      chords.add({
        'chord': chordText,
        'position': charPosition,
        'start': charPosition.toDouble(),
        'end': (charPosition + chordText.length).toDouble(),
        'length': chordText.length,
      });
    }
    
    return chords;
  }

  /// Convert Oslyn song (based on web app logic)
  static OslynSong _convertOslynSong(String sheet, Map<String, dynamic> sectionJson, String key) {
    final lines = sheet.split('\n');
    final phrases = <OslynPhrase>[];
    String currentSection = 'Verse';
    int phraseIndex = 0;
    
    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.trim().isEmpty) continue; // Only check if trimmed is empty, don't trim the line
      
      final lineType = getLineType(line.trim()); // Trim only for line type detection
      
      if (lineType == 'annotation') {
        currentSection = _getSectionName(line);
      } else if (lineType == 'chord') {
        // Find the next lyric line
        String lyricLine = "";
        if (i < lines.length - 1 && getLineType(lines[i + 1].trim()) == 'lyric') {
          lyricLine = lines[i + 1]; // Don't trim the lyric line either
        }
        
        // Use the new _extractChordsFromLine method
        final chordData = _extractChordsFromLine(line);
        final chords = <OslynChord>[];
        
        for (final chordInfo in chordData) {
          final chordText = chordInfo['chord'] as String;
          final charPosition = chordInfo['position'] as int;
          
          // Convert chord to number relative to key
          final chordNumber = _distanceFromKey(chordText, key);
          if (chordNumber != null) {
            chords.add(OslynChord(
              chord: chordNumber,
              isMinor: getIsMinor(chordText),
              position: charPosition, // Use character position for precise alignment
              meta: OslynChordMeta(
                start: chordInfo['start'] as double,
                end: chordInfo['end'] as double,
              ),
              decorator: chordText, // Store the FULL chord name (Cadd9, Dm7, Gsus4, etc.)
            ));
          }
        }
        
        // Create phrase even if there are no lyrics (for chord-only sections like [Intro])
        if (chords.isNotEmpty) {
          phrases.add(OslynPhrase(
            lyric: lyricLine, // This will be empty for chord-only sections
            section: currentSection,
            chords: chords,
            phrase: phraseIndex++,
            chordLine: line, // Store the original chord line text
          ));
        }
      }
    }
    
    return OslynSong(song: phrases);
  }

  static OslynSlide _convertOslynSongToPages(OslynSong song) {
    final pages = <OslynPage>[];
    final phrases = song.song;
    
    if (phrases.isEmpty) {
      return OslynSlide(pages: []);
    }
    
    // Section-aware pagination: keep sections together when possible
    const maxPhrasesForFullSection = 6; // Display all lines if section has 6 or fewer
    const maxPhrasesPerPage = 4; // Maximum lines per page for splitting
    const minPhrasesPerPage = 3; // Minimum lines per page for splitting
    int currentIndex = 0;
    
    while (currentIndex < phrases.length) {
      final currentPhrase = phrases[currentIndex];
      final currentSection = currentPhrase.section;
      
      // Find all phrases in the current section
      final sectionPhrases = <OslynPhrase>[];
      int sectionIndex = currentIndex;
      
      // Collect all phrases that belong to the current section
      while (sectionIndex < phrases.length && phrases[sectionIndex].section == currentSection) {
        sectionPhrases.add(phrases[sectionIndex]);
        sectionIndex++;
      }
      
      // If the section has 6 or fewer lines, display all at once
      if (sectionPhrases.length <= maxPhrasesForFullSection) {
        pages.add(OslynPage(
          lines: sectionPhrases,
          extra: null,
        ));
        currentIndex = sectionIndex;
      } else {
        // Section has 7+ lines, split it across pages using smart grouping
        int sectionStart = 0;
        while (sectionStart < sectionPhrases.length) {
          int linesToTake;
          int remainingLines = sectionPhrases.length - sectionStart;
          
          if (remainingLines <= maxPhrasesPerPage) {
            // Take all remaining lines
            linesToTake = remainingLines;
          } else if (remainingLines == maxPhrasesPerPage + 1) {
            // If we have exactly 5 lines left, split as 3+2 instead of 4+1
            linesToTake = minPhrasesPerPage;
          } else {
            // Take the maximum number of lines
            linesToTake = maxPhrasesPerPage;
          }
          
          final endIndex = sectionStart + linesToTake;
          final pagePhrases = sectionPhrases.sublist(sectionStart, endIndex);
          
          pages.add(OslynPage(
            lines: pagePhrases,
            extra: null,
          ));
          
          sectionStart = endIndex;
        }
        currentIndex = sectionIndex;
      }
    }
    
    return OslynSlide(pages: pages);
  }
}
