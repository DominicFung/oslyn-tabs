import 'oslyn_engine.dart';
import '../models/oslyn_types.dart';

/// Simple test functions for the OslynEngine
class OslynEngineTest {
  static void runTests() {
    print('🧪 Running OslynEngine tests...\n');
    
    _testLineTypeDetection();
    _testChordDetection();
    _testKeyTransposition();
    _testChordSheetProcessing();
    
    print('\n✅ All tests completed!');
  }

  static void _testLineTypeDetection() {
    print('📝 Testing line type detection...');
    
    // Test chord lines
    assert(OslynEngine.getLineType('C G Am F') == LineType.chord);
    assert(OslynEngine.getLineType('Am7 Dm G C') == LineType.chord);
    
    // Test lyric lines
    assert(OslynEngine.getLineType('This is a lyric line') == LineType.lyric);
    assert(OslynEngine.getLineType('Sing along with me') == LineType.lyric);
    
    // Test annotation lines
    assert(OslynEngine.getLineType('[Verse 1]') == LineType.annotation);
    assert(OslynEngine.getLineType('[Chorus]') == LineType.annotation);
    
    // Test blank lines
    assert(OslynEngine.getLineType('   ') == LineType.blank);
    assert(OslynEngine.getLineType('') == LineType.blank);
    
    print('  ✅ Line type detection working correctly');
  }

  static void _testChordDetection() {
    print('🎵 Testing chord detection...');
    
    // Test chord validation
    assert(OslynEngine.getIsMinor('Am') == true);
    assert(OslynEngine.getIsMinor('C') == false);
    assert(OslynEngine.getIsMinor('Dm7') == true);
    
    // Test key stripping
    assert(OslynEngine.stripChordToKey('C') == 'C');
    assert(OslynEngine.stripChordToKey('Am') == 'A');
    assert(OslynEngine.stripChordToKey('G7') == 'G');
    assert(OslynEngine.stripChordToKey('F#m') == 'F#');
    
    print('  ✅ Chord detection working correctly');
  }

  static void _testKeyTransposition() {
    print('🎹 Testing key transposition...');
    
    // Test basic transposition
    assert(OslynEngine.transpose('C', 2) == 'D');
    assert(OslynEngine.transpose('C', -2) == 'Bb');
    assert(OslynEngine.transpose('G', 1) == 'Ab');
    
    // Test chord number conversion
    assert(OslynEngine.getChordByNumber(0, false, 'C') == 'C');
    assert(OslynEngine.getChordByNumber(2, false, 'C') == 'D');
    assert(OslynEngine.getChordByNumber(2, true, 'C') == 'Dm');
    assert(OslynEngine.getChordByNumber(5, false, 'C') == 'F');
    
    print('  ✅ Key transposition working correctly');
  }

  static void _testChordSheetProcessing() {
    print('📄 Testing chord sheet processing...');
    
    String testChordSheet = '''
[Verse 1]
C          G
This is a test song
Am         F
To see if it works
[Chorus]
C          G
Sing along with me
Am         F
In perfect harmony
''';
    
    OslynSong song = OslynEngine.chordSheetToSlides(testChordSheet, 'C');
    
    // Verify basic structure
    assert(song.key == 'C');
    assert(song.pages.isNotEmpty);
    assert(song.pages.length >= 1);
    
    // Verify first page has content
    OslynSlide firstPage = song.pages[0];
    assert(firstPage.lines.isNotEmpty);
    
    print('  ✅ Chord sheet processing working correctly');
    print('  📊 Processed ${song.pages.length} pages with ${firstPage.lines.length} lines on first page');
  }
}
