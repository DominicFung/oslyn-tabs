import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import '../core/oslyn_engine.dart';
import 'line_widget.dart';

/// Slides widget for displaying song lyrics
/// Based on the web app's slides.tsx
class SlidesWidget extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final String textSize;
  final int? page;
  final Function(int)? setPage;
  final Function(bool)? setLastPage;
  final bool pt; // padding top

  const SlidesWidget({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    this.textSize = 'text-lg',
    this.page,
    this.setPage,
    this.setLastPage,
    this.pt = false,
  });

  @override
  State<SlidesWidget> createState() => _SlidesWidgetState();
}

class _SlidesWidgetState extends State<SlidesWidget> {
  OslynSlide? slides;
  int currentPage = 0;
  String maxWidthClass = 'max-w-screen-sm';

  @override
  void initState() {
    super.initState();
    currentPage = widget.page ?? 0;
    _processChordSheet();
  }

  @override
  void didUpdateWidget(SlidesWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.chordSheet != widget.chordSheet ||
        oldWidget.chordSheetKey != widget.chordSheetKey) {
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
      print('🎵 Processing chord sheet:');
      print('Key: ${widget.chordSheetKey}');
      print('Raw sheet length: ${widget.chordSheet.length} characters');
      print('Raw sheet preview:\n${widget.chordSheet.substring(0, widget.chordSheet.length > 200 ? 200 : widget.chordSheet.length)}...');
      
      try {
        final oslynSlides = OslynEngine.chordSheetToSlides(
          widget.chordSheet,
          widget.chordSheetKey,
        );
        
        print('🎼 Parsed result:');
        print('Total pages: ${oslynSlides.pages.length}');
        for (int i = 0; i < oslynSlides.pages.length; i++) {
          final page = oslynSlides.pages[i];
          print('Page ${i + 1}: ${page.lines.length} lines');
          for (int j = 0; j < page.lines.length; j++) {
            final phrase = page.lines[j];
            print('  Line ${j + 1}: "${phrase.lyric}" (${phrase.section}) - ${phrase.chords.length} chords');
            for (final chord in phrase.chords) {
              final chordName = OslynEngine.getChordByNumber(chord.chord, chord.isMinor, widget.chordSheetKey);
              print('    Chord: ${chordName ?? '?'} at position ${chord.position}');
            }
          }
        }
        
        setState(() {
          slides = oslynSlides;
          _updateMaxWidth();
        });
      } catch (e, stackTrace) {
        print('❌ Error processing chord sheet: $e');
        print('Stack trace: $stackTrace');
        print('Chord sheet content that caused error:');
        print(widget.chordSheet);
        
        // Set slides to null to show error state
        setState(() {
          slides = null;
        });
      }
    } else {
      print('⚠️ Chord sheet is empty');
      setState(() {
        slides = null;
      });
    }
  }

  void _updateMaxWidth() {
          if (slides != null && slides!.pages.isNotEmpty && 
          slides!.pages.length > currentPage &&
          slides!.pages[currentPage].lines.isNotEmpty) {
      // Calculate max width based on lyrics (simplified)
      final lines = slides!.pages[currentPage].lines;
      final extra = slides!.pages[currentPage].extra;
      if (extra != null) {
        lines.add(extra);
      }
      
      // Simple width calculation (in real implementation, this would be more sophisticated)
      int maxLength = 0;
      for (final line in lines) {
        if (line.lyric.length > maxLength) {
          maxLength = line.lyric.length;
        }
      }
      
      setState(() {
        if (maxLength < 50) {
          maxWidthClass = 'max-w-screen-sm';
        } else if (maxLength < 80) {
          maxWidthClass = 'max-w-screen-md';
        } else {
          maxWidthClass = 'max-w-screen-lg';
        }
      });
    }
  }

  void _nextPage() {
    if (slides != null && currentPage < slides!.pages.length - 1) {
      final newPage = currentPage + 1;
      setState(() {
        currentPage = newPage;
      });
      _updateMaxWidth();
      widget.setPage?.call(newPage);
      
      // Update last page status
      if (widget.setLastPage != null) {
        final isLastPage = newPage == slides!.pages.length - 1;
        widget.setLastPage!(isLastPage);
      }
    }
  }

  void _previousPage() {
    if (currentPage > 0) {
      final newPage = currentPage - 1;
      setState(() {
        currentPage = newPage;
      });
      _updateMaxWidth();
      widget.setPage?.call(newPage);
      
      // Update last page status
      if (widget.setLastPage != null) {
        final isLastPage = newPage == slides!.pages.length - 1;
        widget.setLastPage!(isLastPage);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (slides == null || slides!.pages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.orange,
              ),
              const SizedBox(height: 16),
              const Text(
                'Chord Sheet Processing Error',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Unable to process the chord sheet for this song.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '🔍 Debug Information:',
                      style: TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chord Sheet Length: ${widget.chordSheet.length} characters',
                      style: const TextStyle(color: Colors.orange, fontSize: 12),
                    ),
                    Text(
                      'Key: ${widget.chordSheetKey}',
                      style: const TextStyle(color: Colors.orange, fontSize: 12),
                    ),
                    Text(
                      'Preview: ${widget.chordSheet.substring(0, widget.chordSheet.length > 100 ? 100 : widget.chordSheet.length)}...',
                      style: const TextStyle(color: Colors.orange, fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Please check the browser console for detailed error information.',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Ensure currentPage is within bounds
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];

    return _buildCenteredBlock(currentPageData);
  }

  Widget _buildCenteredBlock(OslynPage pageData) {
    if (pageData.lines.isEmpty) {
      return const Center(
        child: Text(
          'No content',
          style: TextStyle(color: Colors.white),
        ),
      );
    }

    // Calculate a consistent left margin based on a reference width
    // This ensures all slides have the same left alignment
    final screenWidth = MediaQuery.of(context).size.width;
    final referenceWidth = _calculateReferenceWidth();
    final leftMargin = (screenWidth - referenceWidth) / 2;
    
    return SingleChildScrollView(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          minHeight: MediaQuery.of(context).size.height - 200, // Reserve space for header and navigation
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start, // Changed from center to start
          children: [
            const SizedBox(height: 20), // Small top padding
            // Display current page lines with consistent left margin and section labels
            ..._buildPageContent(pageData, leftMargin),
            
            // Dynamic bottom spacing based on content length
            SizedBox(height: _calculateBottomSpacing(pageData.lines.length)),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildPageContent(OslynPage pageData, double leftMargin) {
    final widgets = <Widget>[];
    String? lastSection;
    
    // Process main lines
    for (int i = 0; i < pageData.lines.length; i++) {
      final phrase = pageData.lines[i];
      
      // Add section label if section changed
      if (lastSection != phrase.section) {
        // Calculate section page info
        final sectionPageInfo = _getSectionPageInfo(phrase.section, currentPage);
        
        widgets.add(
          Container(
            margin: EdgeInsets.only(
              left: leftMargin.clamp(0, double.infinity),
              top: i == 0 ? 0 : 16, // Reduced space before section labels
              bottom: 8, // Reduced space after section label
            ),
            child: _buildSectionLabel(phrase.section, sectionPageInfo),
          ),
        );
        lastSection = phrase.section;
      }
      
      // Add the phrase line
      widgets.add(
        Container(
          margin: EdgeInsets.only(
            left: leftMargin.clamp(0, double.infinity),
            top: 16, // Reduced top margin for all lines
          ),
          child: LineWidget(
            phrase: phrase,
            textSize: widget.textSize,
            chordSheetKey: widget.chordSheetKey,
          ),
        ),
      );
    }
    
    // Process extra line if exists
    if (pageData.extra != null) {
      final phrase = pageData.extra!;
      
      // Add section label if section changed for extra line
      if (lastSection != phrase.section) {
        // Calculate section page info
        final sectionPageInfo = _getSectionPageInfo(phrase.section, currentPage);
        
        widgets.add(
          Container(
            margin: EdgeInsets.only(
              left: leftMargin.clamp(0, double.infinity),
              top: 32,
              bottom: 16,
            ),
            child: _buildSectionLabel(phrase.section, sectionPageInfo),
          ),
        );
      }
      
      // Add the extra phrase line
      widgets.add(
        Container(
          margin: EdgeInsets.only(
            left: leftMargin.clamp(0, double.infinity),
            top: 16, // Reduced top margin
          ),
          child: LineWidget(
            phrase: phrase,
            textSize: widget.textSize,
            chordSheetKey: widget.chordSheetKey,
          ),
        ),
      );
    }
    
    return widgets;
  }

  Map<String, int> _getSectionPageInfo(String section, int currentPage) {
    if (slides == null) return {'current': 1, 'total': 1};
    
    // First, find all pages that contain this section
    final allSectionPages = <int>[];
    for (int i = 0; i < slides!.pages.length; i++) {
      final page = slides!.pages[i];
      bool hasSection = false;
      
      // Check main lines
      for (final phrase in page.lines) {
        if (phrase.section == section) {
          hasSection = true;
          break;
        }
      }
      
      // Check extra line
      if (page.extra != null && page.extra!.section == section) {
        hasSection = true;
      }
      
      if (hasSection) {
        allSectionPages.add(i);
      }
    }
    
    // Find which consecutive group the current page belongs to
    int groupStart = -1;
    int groupEnd = -1;
    
    for (int i = 0; i < allSectionPages.length; i++) {
      if (allSectionPages[i] == currentPage) {
        // Found the current page, now find the start and end of this consecutive group
        groupStart = i;
        groupEnd = i;
        
        // Look backwards for consecutive pages
        for (int j = i - 1; j >= 0; j--) {
          if (allSectionPages[j] == allSectionPages[j + 1] - 1) {
            groupStart = j;
          } else {
            break;
          }
        }
        
        // Look forwards for consecutive pages
        for (int j = i + 1; j < allSectionPages.length; j++) {
          if (allSectionPages[j] == allSectionPages[j - 1] + 1) {
            groupEnd = j;
          } else {
            break;
          }
        }
        break;
      }
    }
    
    if (groupStart == -1) {
      // Current page doesn't contain this section, return default
      return {'current': 1, 'total': 1};
    }
    
    // Calculate the page number within this consecutive group
    final currentGroupPage = currentPage - allSectionPages[groupStart] + 1;
    final totalGroupPages = groupEnd - groupStart + 1;
    
    return {
      'current': currentGroupPage,
      'total': totalGroupPages,
    };
  }

  Widget _buildSectionLabel(String section, Map<String, int> pageInfo) {
    final currentPage = pageInfo['current'] ?? 1;
    final totalPages = pageInfo['total'] ?? 1;
    
    String sectionText = '[$section]';
    if (totalPages > 1) {
      sectionText = '[$section] $currentPage/$totalPages';
    }
    
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF667eea).withValues(alpha: 0.3),
              Color(0xFF764ba2).withValues(alpha: 0.2),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Color(0xFF667eea).withValues(alpha: 0.4),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0xFF667eea).withValues(alpha: 0.2),
              blurRadius: 6,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Text(
          sectionText,
          style: TextStyle(
            color: Colors.white,
            fontSize: _getTextSize(widget.textSize), // Same size as lyrics
            fontFamily: 'monospace', // Same font family as chords and lyrics
            fontWeight: FontWeight.w500,
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }

  double _calculateReferenceWidth() {
    if (slides == null || slides!.pages.isEmpty) {
      return 400; // Default width if no slides
    }
    
    // Find the longest first line across all slides to use as reference
    double maxFirstLineWidth = 0;
    final fontSize = _getTextSize(widget.textSize);
    
    for (final page in slides!.pages) {
      if (page.lines.isNotEmpty) {
        final firstLineWidth = _calculateTextWidth(page.lines.first.lyric, fontSize);
        if (firstLineWidth > maxFirstLineWidth) {
          maxFirstLineWidth = firstLineWidth;
        }
      }
    }
    
    // Use the longest first line width as reference, with some minimum width
    return maxFirstLineWidth > 0 ? maxFirstLineWidth : 400;
  }

  double _calculateTextWidth(String text, double fontSize) {
    // Use the same character width calculation as chord positioning
    const double charWidth = 8.0;
    return text.length * charWidth;
  }

  double _getTextSize(String textSize) {
    switch (textSize) {
      case 'text-xs':
        return 12.0;
      case 'text-sm':
        return 14.0;
      case 'text-base':
        return 16.0;
      case 'text-lg':
        return 18.0;
      case 'text-xl':
        return 20.0;
      case 'text-2xl':
        return 24.0;
      case 'text-3xl':
        return 30.0;
      case 'text-4xl':
        return 36.0;
      case 'text-5xl':
        return 48.0;
      case 'text-6xl':
        return 60.0;
      case 'text-7xl':
        return 72.0;
      case 'text-8xl':
        return 96.0;
      case 'text-9xl':
        return 128.0;
      default:
        return 18.0; // Default to text-lg
    }
  }

  double _calculateBottomSpacing(int lineCount) {
    // Calculate dynamic bottom spacing based on content length
    // More lines = less bottom spacing to prevent overflow
    if (lineCount <= 2) {
      return 120.0; // More space for short content
    } else if (lineCount <= 4) {
      return 80.0; // Standard spacing
    } else if (lineCount <= 6) {
      return 40.0; // Less space for longer content
    } else {
      return 20.0; // Minimal space for very long content
    }
  }

}
