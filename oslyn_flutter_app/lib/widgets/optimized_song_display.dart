import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import '../core/optimized_oslyn_engine.dart';
import 'optimized_slides_widget.dart';

/// Simplified song display widget that demonstrates the optimized pipeline
/// This replaces the complex SongCardPage with a much simpler implementation
class OptimizedSongDisplay extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final String? originalKey;
  final String textSize;
  final int? page;
  final Function(int)? setPage;
  final int capo;

  const OptimizedSongDisplay({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    this.originalKey,
    this.textSize = 'text-lg',
    this.page,
    this.setPage,
    this.capo = 0,
  });

  @override
  State<OptimizedSongDisplay> createState() => _OptimizedSongDisplayState();
}

class _OptimizedSongDisplayState extends State<OptimizedSongDisplay> {
  OslynSlide? slides;
  int currentPage = 0;
  String? originalKey;
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    currentPage = widget.page ?? 0;
    _processChordSheet();
  }

  @override
  void didUpdateWidget(OptimizedSongDisplay oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.chordSheet != widget.chordSheet) {
      _processChordSheet();
    }
    if (oldWidget.page != widget.page) {
      setState(() {
        currentPage = widget.page ?? 0;
      });
    }
  }

  void _processChordSheet() {
    if (widget.chordSheet.isNotEmpty) {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });
      
      try {
        originalKey = widget.originalKey ?? widget.chordSheetKey;
        
        // Use the optimized engine for processing
        final oslynSlides = OptimizedOslynEngine.chordSheetToSlides(
          widget.chordSheet,
          originalKey!,
        );
        
        setState(() {
          slides = oslynSlides.isNotEmpty ? oslynSlides[currentPage] : null;
          isLoading = false;
        });
      } catch (e) {
        setState(() {
          errorMessage = 'Error processing chord sheet: $e';
          isLoading = false;
        });
      }
    } else {
      setState(() {
        slides = null;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              style: TextStyle(
                fontSize: 16,
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    if (slides == null) {
      return const Center(
        child: Text(
          'No content available',
          style: TextStyle(
            fontSize: 18,
            color: Colors.white70,
          ),
        ),
      );
    }

    return OptimizedSlidesWidget(
      chordSheet: widget.chordSheet,
      chordSheetKey: widget.chordSheetKey,
      originalKey: originalKey,
      textSize: widget.textSize,
      page: currentPage,
      setPage: widget.setPage,
      capo: widget.capo,
    );
  }
}

/// Example usage widget showing how to integrate the optimized components
class OptimizedSongCardExample extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final String? originalKey;

  const OptimizedSongCardExample({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    this.originalKey,
  });

  @override
  State<OptimizedSongCardExample> createState() => _OptimizedSongCardExampleState();
}

class _OptimizedSongCardExampleState extends State<OptimizedSongCardExample> {
  int _currentPage = 0;
  String _textSize = 'text-lg';
  int _capo = 0;
  String _currentKey = 'C';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Optimized Song Display',
          style: TextStyle(color: Colors.white),
        ),
        actions: [
          // Text size selector
          DropdownButton<String>(
            value: _textSize,
            dropdownColor: Colors.grey[800],
            style: const TextStyle(color: Colors.white),
            items: const [
              DropdownMenuItem(value: 'text-xs', child: Text('XS')),
              DropdownMenuItem(value: 'text-sm', child: Text('SM')),
              DropdownMenuItem(value: 'text-base', child: Text('Base')),
              DropdownMenuItem(value: 'text-lg', child: Text('LG')),
              DropdownMenuItem(value: 'text-xl', child: Text('XL')),
              DropdownMenuItem(value: 'text-2xl', child: Text('2XL')),
            ],
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _textSize = value;
                });
              }
            },
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Simple controls
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: _currentPage > 0 ? () {
                    setState(() {
                      _currentPage--;
                    });
                  } : null,
                  child: const Text('Previous'),
                ),
                Text(
                  'Page ${_currentPage + 1}',
                  style: const TextStyle(color: Colors.white),
                ),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _currentPage++;
                    });
                  },
                  child: const Text('Next'),
                ),
              ],
            ),
          ),
          // Song display
          Expanded(
            child: OptimizedSongDisplay(
              chordSheet: widget.chordSheet,
              chordSheetKey: _currentKey,
              originalKey: widget.originalKey,
              textSize: _textSize,
              page: _currentPage,
              setPage: (page) {
                setState(() {
                  _currentPage = page;
                });
              },
              capo: _capo,
            ),
          ),
        ],
      ),
    );
  }
}
