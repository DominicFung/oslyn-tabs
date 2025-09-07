// Core types for Oslyn chord parsing system
// Based on the web app's types.d.ts

class OslynSong {
  final List<OslynPhrase> song;
  final Map<String, dynamic> meta;

  OslynSong({
    required this.song,
    this.meta = const {},
  });
}

class OslynSlide {
  final List<OslynPage> pages;

  OslynSlide({
    required this.pages,
  });
}

class OslynPage {
  final List<OslynPhrase> lines;
  final OslynPhrase? extra;

  OslynPage({
    required this.lines,
    this.extra,
  });
}

class OslynPhrase {
  final String lyric;
  final String section;
  final List<OslynChord> chords;
  final int phrase;
  final double? phraseDuration;
  final double? start;
  final String chordLine; // Store the original chord line text

  OslynPhrase({
    required this.lyric,
    required this.section,
    required this.chords,
    required this.phrase,
    this.phraseDuration,
    this.start,
    required this.chordLine,
  });
}

class OslynChord {
  final int chord;
  final bool isMinor;
  final double? beats;
  final int position;
  final OslynChordMeta meta;
  final String decorator;

  OslynChord({
    required this.chord,
    required this.isMinor,
    this.beats,
    required this.position,
    required this.meta,
    this.decorator = '',
  });
}

class OslynChordMeta {
  final double start;
  final double end;

  OslynChordMeta({
    required this.start,
    required this.end,
  });
}
