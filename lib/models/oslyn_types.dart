import 'package:json_annotation/json_annotation.dart';

part 'oslyn_types.g.dart';

/// Represents a single chord with its position and properties
@JsonSerializable()
class OslynChord {
  final int chord; // Chord number (0-11, where 0 = root key)
  final int position; // Position in the lyric string
  final bool isMinor; // Whether this is a minor chord
  final String? decorator; // Additional chord decorations (e.g., "7", "maj", "sus")

  const OslynChord({
    required this.chord,
    required this.position,
    required this.isMinor,
    this.decorator,
  });

  factory OslynChord.fromJson(Map<String, dynamic> json) => _$OslynChordFromJson(json);
  Map<String, dynamic> toJson() => _$OslynChordToJson(this);
}

/// Represents a phrase (line) with chords and lyrics
@JsonSerializable()
class OslynPhrase {
  final String lyric; // The actual lyric text
  final List<OslynChord> chords; // Chords positioned above the lyrics
  final String? section; // Section name (e.g., "Verse 1", "Chorus")

  const OslynPhrase({
    required this.lyric,
    required this.chords,
    this.section,
  });

  factory OslynPhrase.fromJson(Map<String, dynamic> json) => _$OslynPhraseFromJson(json);
  Map<String, dynamic> toJson() => _$OslynPhraseToJson(this);
}

/// Represents a single page/slide of the chord sheet
@JsonSerializable()
class OslynSlide {
  final List<OslynPhrase> lines; // Main phrases on this page
  final OslynPhrase? extra; // Optional "heads up" phrase for next section

  const OslynSlide({
    required this.lines,
    this.extra,
  });

  factory OslynSlide.fromJson(Map<String, dynamic> json) => _$OslynSlideFromJson(json);
  Map<String, dynamic> toJson() => _$OslynSlideToJson(this);
}

/// Represents a complete processed song
@JsonSerializable()
class OslynSong {
  final List<OslynSlide> pages; // All pages/slides of the song
  final String key; // The key the song is in

  const OslynSong({
    required this.pages,
    required this.key,
  });

  factory OslynSong.fromJson(Map<String, dynamic> json) => _$OslynSongFromJson(json);
  Map<String, dynamic> toJson() => _$OslynSongToJson(this);
}

/// Line type detection results
enum LineType {
  chord,      // Line contains mostly chords
  lyric,      // Line contains mostly lyrics
  annotation, // Line is a section marker like [Verse 1]
  blank       // Empty line
}
