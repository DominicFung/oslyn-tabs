import 'package:flutter/material.dart';
import 'chord_positioning_engine.dart';
import 'chord_lyric_renderer.dart';
import 'debug_logger.dart';

/// Test widget to demonstrate the new monospace-based positioning system
/// This can be used to verify that chord positioning is working correctly
class PositioningTestWidget extends StatefulWidget {
  const PositioningTestWidget({super.key});

  @override
  State<PositioningTestWidget> createState() => _PositioningTestWidgetState();
}

class _PositioningTestWidgetState extends State<PositioningTestWidget> {
  bool _showDebugInfo = true;
  String _testChordLine = "G   D   C   G   D";
  String _testLyricLine = "Were creation suddenly";
  double _fontSize = 32.0;

  @override
  void initState() {
    super.initState();
    // Enable debug logging
    DebugLogger.setEnabled(true);
    DebugLogger.setMinLevel(LogLevel.debug);
    ChordPositioningEngine.setDebugPositioning(true);
    ChordLyricRenderer.setDebugSnapping(true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chord Positioning Test'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      backgroundColor: Colors.black,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Debug controls
            Card(
              color: Colors.grey[900],
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Debug Controls',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      title: const Text('Show Debug Info', style: TextStyle(color: Colors.white)),
                      value: _showDebugInfo,
                      onChanged: (value) {
                        setState(() {
                          _showDebugInfo = value;
                        });
                        DebugLogger.setEnabled(value);
                        ChordPositioningEngine.setDebugPositioning(value);
                        ChordLyricRenderer.setDebugSnapping(value);
                      },
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Font Size: ${_fontSize.toInt()}',
                      style: const TextStyle(color: Colors.white),
                    ),
                    Slider(
                      value: _fontSize,
                      min: 16.0,
                      max: 64.0,
                      divisions: 24,
                      onChanged: (value) {
                        setState(() {
                          _fontSize = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Test input fields
            Card(
              color: Colors.grey[900],
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Test Data',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Chord Line',
                        labelStyle: TextStyle(color: Colors.white70),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _testChordLine = value;
                        });
                      },
                      controller: TextEditingController(text: _testChordLine),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(
                        labelText: 'Lyric Line',
                        labelStyle: TextStyle(color: Colors.white70),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (value) {
                        setState(() {
                          _testLyricLine = value;
                        });
                      },
                      controller: TextEditingController(text: _testLyricLine),
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Visual test
            Expanded(
              child: Card(
                color: Colors.grey[900],
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Visual Test (Monospace + Actual Font)',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: Center(
                          child: ChordLyricRenderer.renderChordLyricLine(
                            ChordLyricRenderer.parseChordLyricPair(_testChordLine, _testLyricLine),
                            textSize: 'text-lg',
                            dynamicFontSize: _fontSize,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            
            if (_showDebugInfo) ...[
              const SizedBox(height: 16),
              // Debug information
              Card(
                color: Colors.blue[900],
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Debug Information',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Chord Line: "${_testChordLine}" (${_testChordLine.length} chars)',
                        style: const TextStyle(color: Colors.white70, fontFamily: 'monospace'),
                      ),
                      Text(
                        'Lyric Line: "${_testLyricLine}" (${_testLyricLine.length} chars)',
                        style: const TextStyle(color: Colors.white70, fontFamily: 'monospace'),
                      ),
                      Text(
                        'Font Size: $_fontSize',
                        style: const TextStyle(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Check console for detailed positioning logs',
                        style: const TextStyle(color: Colors.blue, fontStyle: FontStyle.italic),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
