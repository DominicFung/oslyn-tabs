import '../models/oslyn_types.dart';

/// Core chord processing engine for Flutter
class OslynEngine {
  // Key distance mapping for transposition
  static const List<List<String>> _keyDistanceMap = [
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

  // Regex patterns for chord detection
  static final RegExp _chordRegex = RegExp(r'^([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)$');
  static final RegExp _chordRegexForTextBlock = RegExp(r'(^| |\n)([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(add|sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)(\n| |$)');
  static final RegExp _keyRegex = RegExp(r'^[A-Ga-g](##?|bb?)?$');

  /// Detects the type of a line in a chord sheet
  static LineType getLineType(String line) {
    if (_isChordLine(line)) {
      return LineType.chord;
    } else if (line.trim().replaceAll(RegExp(r'\s+'), ' ') == ' ') {
      return LineType.blank;
    } else if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return LineType.annotation;
    } else {
      return LineType.lyric;
    }
  }

  /// Determines if a line contains mostly chords
  static bool _isChordLine(String line) {
    String tempLine = line.trim()
        .replaceAll(RegExp(r'[^a-zA-Z0-9#\/\s]'), '') // Remove unwanted chars
        .replaceAll(RegExp(r'\s+'), ' ') // Turn multiple spaces into single space
        .trim();
    
    if (tempLine.isEmpty) return false;
    
    List<String> items = tempLine.split(' ');
    int numOfChords = 0;
    int numOfNonChords = 0;

    for (String item in items) {
      if (_chordRegex.hasMatch(item)) {
        numOfChords++;
      } else {
        numOfNonChords++;
      }
    }

    return numOfChords >= numOfNonChords;
  }

  /// Extracts section name from annotation lines like [Verse 1]
  static String? getSectionName(String line) {
    if (!line.trim().startsWith('[') || !line.trim().endsWith(']')) {
      return null;
    }
    
    String content = line.trim().substring(1, line.trim().length - 1);
    return content.isNotEmpty ? content : null;
  }

  /// Determines if a chord is minor
  static bool getIsMinor(String chord) {
    String baseChord = chord.split(RegExp(r'(sus|maj|min|aug|dim)'))[0];
    return baseChord.toLowerCase().endsWith('m') || 
           baseChord.toLowerCase().endsWith('m7');
  }

  /// Strips a chord to its basic key (removes extensions, inversions, etc.)
  static String? stripChordToKey(String chord) {
    // Split by common chord extensions and take first part
    String baseChord = chord.split(RegExp(r'(add|sus|maj|min|aug|dim|\/)'))[0];
    
    // Remove minor/major indicators
    baseChord = baseChord.split(RegExp(r'(M|m)'))[0];
    
    // Remove numbers
    baseChord = baseChord.replaceAll(RegExp(r'[0-9]'), '');
    
    // Validate it's a valid key
    if (_keyRegex.hasMatch(baseChord)) {
      return baseChord;
    }
    
    return null;
  }

  /// Calculates the distance (in semitones) from a key to a chord
  static int? distanceFromKey(String chord, String key) {
    if (!_keyRegex.hasMatch(key)) return null;
    
    String? strippedChord = stripChordToKey(chord);
    if (strippedChord == null) return null;

    // Find the key index
    int? keyIndex;
    for (int i = 0; i < _keyDistanceMap.length; i++) {
      if (_keyDistanceMap[i].contains(key)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;

    // Find the chord distance
    for (int distance = 0; distance < 12; distance++) {
      int index = (keyIndex + distance) % _keyDistanceMap.length;
      if (_keyDistanceMap[index].contains(strippedChord)) {
        return distance;
      }
    }

    return null;
  }

  /// Converts a chord number to its actual chord name based on the key
  static String? getChordByNumber(int chord, bool isMinor, String key) {
    if (chord < 0 || chord > 11) return null;
    
    // Get the base note from the key
    String? baseNote = stripChordToKey(key);
    if (baseNote == null) return null;
    
    // Find the key index
    int? keyIndex;
    for (int i = 0; i < _keyDistanceMap.length; i++) {
      if (_keyDistanceMap[i].contains(baseNote)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;
    
    // Calculate the actual note
    int noteIndex = (keyIndex + chord) % _keyDistanceMap.length;
    String note = _keyDistanceMap[noteIndex][0]; // Use the first (most common) spelling
    
    // Add minor indicator if needed
    if (isMinor) {
      note += 'm';
    }
    
    return note;
  }

  /// Transposes a key by a given number of semitones
  static String? transpose(String key, int semitones) {
    if (!_keyRegex.hasMatch(key)) return null;
    
    // Find the key index
    int? keyIndex;
    for (int i = 0; i < _keyDistanceMap.length; i++) {
      if (_keyDistanceMap[i].contains(key)) {
        keyIndex = i;
        break;
      }
    }
    
    if (keyIndex == null) return null;
    
    // Calculate new index
    int newIndex = (keyIndex + semitones) % _keyDistanceMap.length;
    if (newIndex < 0) newIndex += _keyDistanceMap.length;
    
    return _keyDistanceMap[newIndex][0]; // Use the first (most common) spelling
  }

  /// Converts a raw chord sheet string to a structured OslynSong
  static OslynSong chordSheetToSlides(String chordSheet, String key) {
    List<String> lines = chordSheet.split('\n');
    List<OslynSlide> slides = [];
    List<OslynPhrase> currentPage = [];
    
    const int linesPerPage = 20; // Default lines per page
    int lineCount = 0;
    
    for (String line in lines) {
      LineType lineType = getLineType(line);
      
      if (lineType == LineType.annotation) {
        // Start a new section
        String? sectionName = getSectionName(line);
        if (sectionName != null) {
          // If we have content, create a new page
          if (currentPage.isNotEmpty) {
            slides.add(OslynSlide(lines: List.from(currentPage)));
            currentPage.clear();
            lineCount = 0;
          }
        }
      } else if (lineType == LineType.chord) {
        // This is a chord line - we'll process it with the next lyric line
        // For now, just add it as a blank line to maintain spacing
        currentPage.add(OslynPhrase(
          lyric: line,
          chords: [],
          section: null,
        ));
        lineCount++;
      } else if (lineType == LineType.lyric) {
        // This is a lyric line - create a phrase
        currentPage.add(OslynPhrase(
          lyric: line,
          chords: _extractChordsFromLine(line, key),
          section: null,
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
          section: null,
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

  /// Extracts chords from a lyric line and positions them
  static List<OslynChord> _extractChordsFromLine(String line, String key) {
    List<OslynChord> chords = [];
    
    // This is a simplified version - in the full implementation,
    // we'd need to parse the chord sheet more intelligently
    // For now, return empty list to get the structure working
    
    return chords;
  }
}
