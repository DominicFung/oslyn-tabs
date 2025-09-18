import '../models/oslyn_types.dart';

/// Optimized chord processing engine with simplified logic and better performance
class OslynEngine {
  // Key distance mapping for transposition
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

  // Simplified regex patterns
  static final RegExp _chordRegex = RegExp(r'([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)');
  static final RegExp _keyRegex = RegExp(r'^[A-Ga-g](##?|bb?)?$');

  /// Detects the type of a line in a chord sheet
  static LineType getLineType(String line) {
    if (_isChordLine(line)) {
      return LineType.chord;
    } else if (line.trim().isEmpty) {
      return LineType.blank;
    } else if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return LineType.annotation;
    } else {
      return LineType.lyric;
    }
  }

  /// Determines if a line contains mostly chords
  static bool _isChordLine(String line) {
    final tempLine = line.trim()
        .replaceAll(RegExp(r'[^a-zA-Z0-9#\/\s]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    
    if (tempLine.isEmpty) return false;
    
    final items = tempLine.split(' ');
    int numOfChords = 0;
    int numOfNonChords = 0;

    for (final item in items) {
      if (_chordRegex.hasMatch(item)) {
        numOfChords++;
      } else {
        numOfNonChords++;
      }
    }

    return numOfChords >= numOfNonChords;
  }

  /// Extracts section name from annotation lines
  static String? getSectionName(String line) {
    if (!line.trim().startsWith('[') || !line.trim().endsWith(']')) {
      return null;
    }
    
    final content = line.trim().substring(1, line.trim().length - 1);
    return content.isNotEmpty ? content : null;
  }

  /// Determines if a chord is minor
  static bool getIsMinor(String chord) {
    final baseChord = chord.split(RegExp(r'(sus|maj|min|aug|dim)'))[0];
    return baseChord.toLowerCase().endsWith('m') || 
           baseChord.toLowerCase().endsWith('m7');
  }

  /// Strips a chord to its basic key
  static String? stripChordToKey(String chord) {
    String baseChord = chord.split(RegExp(r'(add|sus|maj|min|aug|dim|\/)'))[0];
    baseChord = baseChord.split(RegExp(r'(M|m)'))[0];
    baseChord = baseChord.replaceAll(RegExp(r'[0-9]'), '');
    
    if (_keyRegex.hasMatch(baseChord)) {
      return baseChord;
    }
    
    return null;
  }

  /// Calculates the distance (in semitones) from a key to a chord
  static int? distanceFromKey(String chord, String key) {
    if (!_keyRegex.hasMatch(key)) return null;
    
    final strippedChord = stripChordToKey(chord);
    if (strippedChord == null) return null;

    // Find the key index
    int? keyIndex;
    for (int i = 0; i < keyDistanceMap.length; i++) {
      if (keyDistanceMap[i].contains(key)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;

    // Find the chord distance
    for (int distance = 0; distance < 12; distance++) {
      int index = (keyIndex + distance) % keyDistanceMap.length;
      if (keyDistanceMap[index].contains(strippedChord)) {
        return distance;
      }
    }

    return null;
  }

  /// Converts a chord number to its actual chord name based on the key
  static String? getChordByNumber(int chord, bool isMinor, String key) {
    if (chord < 0 || chord > 11) return null;
    
    final baseNote = stripChordToKey(key);
    if (baseNote == null) return null;
    
    int? keyIndex;
    for (int i = 0; i < keyDistanceMap.length; i++) {
      if (keyDistanceMap[i].contains(baseNote)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;
    
    int noteIndex = (keyIndex + chord) % keyDistanceMap.length;
    String note = keyDistanceMap[noteIndex][0];
    
    if (isMinor) {
      note += 'm';
    }
    
    return note;
  }

  /// Transposes a key by a given number of semitones
  static String? transpose(String key, int semitones) {
    if (!_keyRegex.hasMatch(key)) return null;
    
    int? keyIndex;
    for (int i = 0; i < keyDistanceMap.length; i++) {
      if (keyDistanceMap[i].contains(key)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;
    
    int newIndex = (keyIndex + semitones) % keyDistanceMap.length;
    if (newIndex < 0) newIndex += keyDistanceMap.length;
    
    return keyDistanceMap[newIndex][0];
  }

  /// Converts a raw chord sheet string to a structured OslynSong
  static OslynSong chordSheetToSlides(String chordSheet, String key) {
    final lines = chordSheet.split('\n');
    final slides = <OslynSlide>[];
    final currentPage = <OslynPhrase>[];
    
    const int linesPerPage = 20;
    int lineCount = 0;
    String? currentSection;
    
    for (final line in lines) {
      final lineType = getLineType(line);
      
      if (lineType == LineType.annotation) {
        // Start a new section
        final sectionName = getSectionName(line);
        if (sectionName != null) {
          currentSection = sectionName;
          // If we have content, create a new page
          if (currentPage.isNotEmpty) {
            slides.add(OslynSlide(lines: List.from(currentPage)));
            currentPage.clear();
            lineCount = 0;
          }
        }
      } else if (lineType == LineType.chord) {
        // This is a chord line - we'll process it with the next lyric line
        currentPage.add(OslynPhrase(
          lyric: line,
          chords: [],
          section: currentSection,
        ));
        lineCount++;
      } else if (lineType == LineType.lyric) {
        // This is a lyric line - create a phrase
        currentPage.add(OslynPhrase(
          lyric: line,
          chords: _extractChordsFromLine(line, key),
          section: currentSection,
        ));
        lineCount++;
        
        // Check if we need to start a new page
        if (lineCount >= linesPerPage) {
          slides.add(OslynSlide(lines: List.from(currentPage)));
          currentPage.clear();
          lineCount = 0;
        }
      } else if (lineType == LineType.blank) {
        // Add blank line for spacing
        currentPage.add(OslynPhrase(
          lyric: '',
          chords: [],
          section: currentSection,
        ));
        lineCount++;
      }
    }
    
    // Add any remaining content
    if (currentPage.isNotEmpty) {
      slides.add(OslynSlide(lines: List.from(currentPage)));
    }
    
    return OslynSong(pages: slides, key: key);
  }

  /// Simplified chord extraction from a lyric line
  static List<OslynChord> _extractChordsFromLine(String line, String key) {
    final chords = <OslynChord>[];
    
    // Find all chord matches in the line
    final matches = _chordRegex.allMatches(line);
    
    for (int i = 0; i < matches.length; i++) {
      final match = matches.elementAt(i);
      final chordText = match.group(1)!;
      final position = match.start;
      
      // Determine if it's minor
      final isMinor = getIsMinor(chordText);
      
      // Extract decorator (extensions, etc.)
      final decoratorMatch = RegExp(r'(sus|maj|min|aug|dim|add|7|9|11|13)').firstMatch(chordText);
      final decorator = decoratorMatch?.group(1) ?? '';
      
      // Calculate chord number based on key
      final chordNumber = _calculateChordNumber(chordText, key);
      
      if (chordNumber != null) {
        chords.add(OslynChord(
          chord: chordNumber,
          position: position,
          isMinor: isMinor,
          decorator: decorator,
        ));
      }
    }
    return chords;
  }
  

  /// Calculate chord number based on key
  static int? _calculateChordNumber(String chord, String key) {
    final strippedChord = stripChordToKey(chord);
    if (strippedChord == null) return null;
    
    final distance = distanceFromKey(chord, key);
    return distance;
  }
}