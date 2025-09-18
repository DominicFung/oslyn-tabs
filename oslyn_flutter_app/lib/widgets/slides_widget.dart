import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import '../core/oslyn_engine.dart';
import 'line_widget.dart';

/// Helper class to group lines for highlighting
class _LineGroup {
  final bool isHighlighted;
  final String section;
  final List<OslynPhrase> lines;
  
  _LineGroup({
    required this.isHighlighted,
    required this.section,
    required this.lines,
  });
}

/// Compactness levels for progressive spacing reduction
enum CompactnessLevel {
  normal,        // 16px spacing, original text size
  compact,       // 8px spacing, one level smaller text
  extraCompact,  // 4px spacing, two levels smaller text
  ultraCompact,  // 2px spacing, three levels smaller text
  hidden,        // Hide content entirely
}

/// Slides widget for displaying song lyrics
/// Based on the web app's slides.tsx
class SlidesWidget extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final String? originalKey; // The original key from the song
  final String textSize;
  final int? page;
  final Function(int)? setPage;
  final Function(bool)? setLastPage;
  final Function(bool)? onCompactModeChanged; // Callback for compact mode changes
  final Function(String)? onSectionChanged; // Callback for section changes
  final VoidCallback? onPreviousPage; // Callback for previous page
  final VoidCallback? onNextPage; // Callback for next page
  final bool pt; // padding top
  final int capo; // Capo fret number (0-12)

  const SlidesWidget({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    this.originalKey,
    this.textSize = 'text-lg',
    this.page,
    this.setPage,
    this.setLastPage,
    this.onCompactModeChanged,
    this.onSectionChanged,
    this.onPreviousPage,
    this.onNextPage,
    this.pt = false,
    this.capo = 0,
  });

  @override
  State<SlidesWidget> createState() => SlidesWidgetState();
}

class SlidesWidgetState extends State<SlidesWidget> {
  OslynSlide? slides;
  int currentPage = 0;
  String maxWidthClass = 'max-w-screen-sm';
  String? originalKey; // Track the original key used for processing
  
  // New state for 2-line navigation
  int _currentLineGroup = 0; // Which group of lines we're currently showing
  bool _isInLineNavigationMode = false; // Whether we're in line navigation mode
  
  // Configurable line group size (can be changed to 3, 4, etc. in the future)
  static const int _lineGroupSize = 2;

  @override
  void initState() {
    super.initState();
    currentPage = widget.page ?? 0;
    _processChordSheet();
  }

  @override
  void didUpdateWidget(SlidesWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Only reprocess if the chord sheet content changes, not the key
    if (oldWidget.chordSheet != widget.chordSheet) {
      _processChordSheet();
    }
    if (oldWidget.page != widget.page) {
      setState(() {
        currentPage = widget.page ?? 0;
        _currentLineGroup = 0; // Reset line group when page changes
      });
      _debugPrintAllPagesSnapping();
    }
  }

  void _processChordSheet() {
    if (widget.chordSheet.isNotEmpty) {
      print('🎵 Processing chord sheet:');
      print('Key: ${widget.chordSheetKey}');
      print('Raw sheet length: ${widget.chordSheet.length} characters');
      print('Raw sheet preview:\n${widget.chordSheet.substring(0, widget.chordSheet.length > 200 ? 200 : widget.chordSheet.length)}...');
      
      // Store the original key for transposition calculations
      originalKey = widget.originalKey ?? widget.chordSheetKey;
      
      try {
        final oslynSlides = OslynEngine.chordSheetToSlides(
          widget.chordSheet,
          originalKey!, // Process with original key
        );
        
        print('🎼 Parsed result:');
        print('Total pages: ${oslynSlides.pages.length}');
        // Temporarily disabled chord and position debugging to focus on queue management
        // for (int i = 0; i < oslynSlides.pages.length; i++) {
        //   final page = oslynSlides.pages[i];
        //   print('Page ${i + 1}: ${page.lines.length} lines');
        //   for (int j = 0; j < page.lines.length; j++) {
        //     final phrase = page.lines[j];
        //     print('  Line ${j + 1}: "${phrase.lyric}" (${phrase.section}) - ${phrase.chords.length} chords');
        //     for (final chord in phrase.chords) {
        //       final chordName = OslynEngine.getChordByNumber(chord.chord, chord.isMinor, originalKey!);
        //       print('    Chord: ${chordName ?? '?'} at position ${chord.position}');
        //     }
        //   }
        // }
        
        setState(() {
          slides = oslynSlides;
          _updateMaxWidth();
        });
        _debugPrintAllPagesSnapping();
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



  void _debugPrintAllPagesSnapping() {
    // Disabled for performance - was causing excessive logging
    return;
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
              Text(
                'Chord Sheet Processing Error',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Unable to process the chord sheet for this song.',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white70,
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
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
              Text(
                'Please check the browser console for detailed error information.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white70,
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
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
      return Center(
        child: Text(
          'No content',
          style: TextStyle(
            color: Colors.white,
            fontFamily: '.SF Pro Text',
            fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
          ),
        ),
      );
    }

    // Check compactness level
    final screenHeight = MediaQuery.of(context).size.height;
    final compactnessLevel = _getCompactnessLevel(pageData, screenHeight);
    
    // If content should be hidden, show a message
    if (compactnessLevel == CompactnessLevel.hidden) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.visibility_off,
                size: 48,
                color: Colors.white.withValues(alpha: 0.6),
              ),
              const SizedBox(height: 16),
              Text(
                'Screen too small to display lyrics',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: Colors.white.withValues(alpha: 0.8),
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Rotate device or increase screen size',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.white.withValues(alpha: 0.6),
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Check if we should use 2-line navigation mode
    final shouldUseLineNavigation = _shouldUseLineNavigationMode(pageData, screenHeight);
    
    // Update line navigation mode state
    if (shouldUseLineNavigation != _isInLineNavigationMode) {
      _isInLineNavigationMode = shouldUseLineNavigation;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onCompactModeChanged?.call(_isInLineNavigationMode);
      });
    }
    
    // Notify parent of current section
    if (pageData.lines.isNotEmpty) {
      final currentSection = pageData.lines.first.section;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        widget.onSectionChanged?.call(currentSection);
      });
    }
    
    if (shouldUseLineNavigation) {
      return _buildLineNavigationLayout(pageData, compactnessLevel);
    }

    // Use symmetrical margins for centered alignment
    final leftMargin = 20.0; // Fixed left margin for consistent alignment
    final rightMargin = 20.0; // Fixed right margin for symmetrical alignment
    
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight, // Use the full available height from parent
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start, // Changed from center to start
              crossAxisAlignment: CrossAxisAlignment.center, // Center content horizontally
              children: [
                const SizedBox(height: 20), // Small top padding
                // Display current page lines with consistent margins and section labels
                ..._buildPageContent(pageData, leftMargin, rightMargin, compactnessLevel),
                
                // Dynamic bottom spacing based on content length
                SizedBox(height: _calculateBottomSpacing(pageData.lines.length)),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Determine if we should use line navigation mode based on content and screen height
  bool _shouldUseLineNavigationMode(OslynPage pageData, double screenHeight) {
    // Use line navigation if:
    // 1. Screen height is less than 600px (small screens)
    // 2. OR if there are more lines than the group size
    final lineCount = pageData.lines.length + (pageData.extra != null ? 1 : 0);
    return screenHeight < 600 || lineCount > _lineGroupSize;
  }
  
  /// Get the current line group for display
  List<OslynPhrase> _getCurrentLineGroup(OslynPage pageData) {
    final allLines = <OslynPhrase>[];
    allLines.addAll(pageData.lines);
    if (pageData.extra != null) {
      allLines.add(pageData.extra!);
    }
    
    final startIndex = _currentLineGroup * _lineGroupSize;
    final endIndex = (startIndex + _lineGroupSize).clamp(0, allLines.length);
    
    if (startIndex >= allLines.length) {
      return [];
    }
    
    return allLines.sublist(startIndex, endIndex);
  }
  
  /// Get the total number of line groups for the current page
  int _getTotalLineGroups(OslynPage pageData) {
    final lineCount = pageData.lines.length + (pageData.extra != null ? 1 : 0);
    return (lineCount / _lineGroupSize).ceil();
  }
  
  /// Navigate to the next line group
  void _nextLineGroup() {
    if (slides == null || slides!.pages.isEmpty) return;
    
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    final totalGroups = _getTotalLineGroups(currentPageData);
    
    if (_currentLineGroup < totalGroups - 1) {
      setState(() {
        _currentLineGroup++;
      });
    } else {
      // Move to next page and reset line group
      widget.onNextPage?.call();
      setState(() {
        _currentLineGroup = 0;
      });
    }
  }
  
  /// Navigate to the previous line group
  void _previousLineGroup() {
    if (_currentLineGroup > 0) {
      setState(() {
        _currentLineGroup--;
      });
    } else {
      // Move to previous page and set to last line group
      widget.onPreviousPage?.call();
      if (slides != null && slides!.pages.isNotEmpty) {
        final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
        final currentPageData = slides!.pages[safeCurrentPage];
        final totalGroups = _getTotalLineGroups(currentPageData);
        setState(() {
          _currentLineGroup = (totalGroups - 1).clamp(0, totalGroups - 1);
        });
      }
    }
  }

  /// Determine the compactness level based on screen height and content
  CompactnessLevel _getCompactnessLevel(OslynPage pageData, double screenHeight) {
    // Always use normal compactness level - no font size reduction based on height
    return CompactnessLevel.normal;
  }

  /// Check if compact mode should be used (for parent to know)
  bool shouldUseCompactMode() {
    if (slides == null || slides!.pages.isEmpty) return false;
    
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    final screenHeight = MediaQuery.of(context).size.height;
    
    return _shouldUseLineNavigationMode(currentPageData, screenHeight);
  }
  
  /// Navigate to next line group (for parent to call)
  void nextLineGroup() {
    _nextLineGroup();
  }
  
  /// Navigate to previous line group (for parent to call)
  void previousLineGroup() {
    _previousLineGroup();
  }
  
  /// Get current line group info (for parent to know)
  Map<String, int> getCurrentLineGroupInfo() {
    if (slides == null || slides!.pages.isEmpty) {
      return {'current': 1, 'total': 1};
    }
    
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    final totalGroups = _getTotalLineGroups(currentPageData);
    
    return {
      'current': _currentLineGroup + 1,
      'total': totalGroups,
    };
  }

  /// Build 2-line navigation layout for lyrics
  Widget _buildLineNavigationLayout(OslynPage pageData, CompactnessLevel compactnessLevel) {
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenHeight < 600;
    
    // Get the current 2-line group to display
    final currentLines = _getCurrentLineGroup(pageData);
    
    // Use symmetrical margins for centered alignment
    final leftMargin = 20.0; // Fixed left margin for consistent alignment
    final rightMargin = 20.0; // Fixed right margin for symmetrical alignment
    
    return LayoutBuilder(
      builder: (context, constraints) {
        if (isSmallScreen) {
          // Small screen: Show only the current 2-line group
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight, // Use full available height
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center, // Center content horizontally
                children: [
                  const SizedBox(height: 20),
                  ..._buildLineGroupContent(currentLines, leftMargin, rightMargin, compactnessLevel, showHighlight: false),
                  SizedBox(height: _calculateBottomSpacing(currentLines.length)),
                ],
              ),
            ),
          );
        } else {
          // Large screen: Show all lines but highlight the current 2-line group
          final allLines = <OslynPhrase>[];
          allLines.addAll(pageData.lines);
          if (pageData.extra != null) {
            allLines.add(pageData.extra!);
          }
          
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight, // Use full available height
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center, // Center content horizontally
                children: [
                  const SizedBox(height: 20),
                  ..._buildHighlightedLineGroupContent(allLines, currentLines, leftMargin, rightMargin, compactnessLevel),
                  SizedBox(height: _calculateBottomSpacing(allLines.length)),
                ],
              ),
            ),
          );
        }
      },
    );
  }

  /// Build content for a line group (2 lines)
  List<Widget> _buildLineGroupContent(List<OslynPhrase> lines, double leftMargin, double rightMargin, CompactnessLevel compactnessLevel, {bool showHighlight = false}) {
    final widgets = <Widget>[];
    String? lastSection;
    
    // Get text size and spacing based on compactness level
    final textSize = _getTextSizeForCompactness(widget.textSize, compactnessLevel);
    final spacing = _getSpacingForCompactness(compactnessLevel);
    
    // Calculate dynamic font size if needed
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
    for (int i = 0; i < lines.length; i++) {
      final phrase = lines[i];
      
      // Add section label if section changed
      if (lastSection != phrase.section) {
        final sectionPageInfo = _getSectionPageInfo(phrase.section, currentPage);
        
        widgets.add(
          Container(
            margin: EdgeInsets.only(
              left: leftMargin.clamp(0, double.infinity),
              right: rightMargin.clamp(0, double.infinity),
              top: i == 0 ? 0 : spacing.sectionTop,
              bottom: spacing.sectionBottom,
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
            right: rightMargin.clamp(0, double.infinity),
            top: spacing.line,
          ),
          child: LineWidget(
            phrase: phrase,
            textSize: textSize,
            chordSheetKey: widget.chordSheetKey,
            originalKey: originalKey,
            capo: widget.capo,
            dynamicFontSize: dynamicFontSize,
          ),
        ),
      );
    }
    
    return widgets;
  }
  
  /// Build content with highlighted line group for large screens
  List<Widget> _buildHighlightedLineGroupContent(List<OslynPhrase> allLines, List<OslynPhrase> currentLines, double leftMargin, double rightMargin, CompactnessLevel compactnessLevel) {
    final widgets = <Widget>[];
    String? lastSection;
    
    // Get text size and spacing based on compactness level
    final textSize = _getTextSizeForCompactness(widget.textSize, compactnessLevel);
    final spacing = _getSpacingForCompactness(compactnessLevel);
    
    // Calculate dynamic font size if needed
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
    // Find the start and end indices of the current line group
    final startIndex = _currentLineGroup * _lineGroupSize;
    final endIndex = (startIndex + _lineGroupSize).clamp(0, allLines.length);
    
    // Group lines by sections and line groups
    final lineGroups = <_LineGroup>[];
    _LineGroup? currentGroup;
    
    for (int i = 0; i < allLines.length; i++) {
      final phrase = allLines[i];
      final isInCurrentGroup = i >= startIndex && i < endIndex;
      
      // Check if we need to start a new group (section change or line group boundary)
      if (currentGroup == null || 
          lastSection != phrase.section || 
          (isInCurrentGroup && !currentGroup.isHighlighted) ||
          (!isInCurrentGroup && currentGroup.isHighlighted)) {
        
        // Close previous group if it exists
        if (currentGroup != null) {
          lineGroups.add(currentGroup);
        }
        
        // Start new group
        currentGroup = _LineGroup(
          isHighlighted: isInCurrentGroup,
          section: phrase.section,
          lines: [phrase],
        );
      } else {
        // Add to current group
        currentGroup.lines.add(phrase);
      }
      
      lastSection = phrase.section;
    }
    
    // Add the last group
    if (currentGroup != null) {
      lineGroups.add(currentGroup);
    }
    
    // Build widgets for each group
    for (int groupIndex = 0; groupIndex < lineGroups.length; groupIndex++) {
      final group = lineGroups[groupIndex];
      
      // Add section label if this is the first group or section changed
      if (groupIndex == 0 || (groupIndex > 0 && lineGroups[groupIndex - 1].section != group.section)) {
        final sectionPageInfo = _getSectionPageInfo(group.section, currentPage);
        
        widgets.add(
          Container(
            margin: EdgeInsets.only(
              left: leftMargin.clamp(0, double.infinity),
              top: groupIndex == 0 ? 0 : spacing.sectionTop,
              bottom: spacing.sectionBottom,
            ),
            child: _buildSectionLabel(group.section, sectionPageInfo),
          ),
        );
      }
      
      // Build the line group content
      final groupWidgets = <Widget>[];
      for (int i = 0; i < group.lines.length; i++) {
        final phrase = group.lines[i];
        
        groupWidgets.add(
          Container(
            margin: EdgeInsets.only(
              top: i == 0 ? 0 : spacing.line,
            ),
            child: LineWidget(
              phrase: phrase,
              textSize: textSize,
              chordSheetKey: widget.chordSheetKey,
              originalKey: originalKey,
              capo: widget.capo,
              dynamicFontSize: dynamicFontSize,
            ),
          ),
        );
      }
      
      // Wrap the group in a container with optional highlight
      Widget groupContainer = Container(
        margin: EdgeInsets.only(
          left: leftMargin.clamp(0, double.infinity),
          right: rightMargin.clamp(0, double.infinity),
          top: groupIndex == 0 ? 0 : spacing.line,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center, // Center content horizontally
          children: groupWidgets,
        ),
      );
      
      if (group.isHighlighted) {
        // Wrap in highlight container for current group
        groupContainer = Container(
          margin: EdgeInsets.only(
            left: leftMargin.clamp(0, double.infinity),
            right: rightMargin.clamp(0, double.infinity),
            top: groupIndex == 0 ? 0 : spacing.line,
          ),
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFF8B5CF6).withValues(alpha: 0.8), // Purple color
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center, // Center content horizontally
            children: groupWidgets,
          ),
        );
      }
      
      widgets.add(groupContainer);
    }
    
    return widgets;
  }


  /// Get text size based on compactness level
  String _getTextSizeForCompactness(String originalTextSize, CompactnessLevel level) {
    // Always return original text size - no font size reduction
    return originalTextSize;
  }

  /// Get spacing values based on compactness level
  ({double line, double sectionTop, double sectionBottom}) _getSpacingForCompactness(CompactnessLevel level) {
    switch (level) {
      case CompactnessLevel.normal:
        return (line: 16, sectionTop: 16, sectionBottom: 8);
      case CompactnessLevel.compact:
        return (line: 8, sectionTop: 8, sectionBottom: 4);
      case CompactnessLevel.extraCompact:
        return (line: 4, sectionTop: 4, sectionBottom: 2);
      case CompactnessLevel.ultraCompact:
        return (line: 2, sectionTop: 2, sectionBottom: 1);
      case CompactnessLevel.hidden:
        return (line: 0, sectionTop: 0, sectionBottom: 0);
    }
  }



  List<Widget> _buildPageContent(OslynPage pageData, double leftMargin, double rightMargin, CompactnessLevel compactnessLevel) {
    final widgets = <Widget>[];
    String? lastSection;
    
    // Get text size and spacing based on compactness level
    final textSize = _getTextSizeForCompactness(widget.textSize, compactnessLevel);
    final spacing = _getSpacingForCompactness(compactnessLevel);
    
    // Calculate dynamic font size if needed
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
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
              right: rightMargin.clamp(0, double.infinity),
              top: i == 0 ? 0 : spacing.sectionTop,
              bottom: spacing.sectionBottom,
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
            right: rightMargin.clamp(0, double.infinity),
            top: spacing.line,
          ),
          child: LineWidget(
            phrase: phrase,
            textSize: textSize,
            chordSheetKey: widget.chordSheetKey,
            originalKey: originalKey,
            capo: widget.capo,
            dynamicFontSize: dynamicFontSize,
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
              right: rightMargin.clamp(0, double.infinity),
              top: spacing.sectionTop * 2, // Double spacing for extra line section
              bottom: spacing.sectionBottom * 2,
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
            right: rightMargin.clamp(0, double.infinity),
            top: spacing.line,
          ),
          child: LineWidget(
            phrase: phrase,
            textSize: textSize,
            chordSheetKey: widget.chordSheetKey,
            originalKey: originalKey,
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
            fontSize: _getTextSize(widget.textSize), // Same size as lyrics
            fontWeight: FontWeight.w500,
            color: Colors.white,
            fontFamily: '.SF Pro Text',
            fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
            letterSpacing: 0.8,
          ),
        ),
      ),
    );
  }



  double _getTextSize(String textSize) {
    // Handle dynamic sizing
    if (textSize == 'dynamic') {
      return _getDynamicTextSize();
    }
    
    switch (textSize) {
      case 'text-xs':
        return 20.0;  // was 16.0 (2XL becomes new base)
      case 'text-sm':
        return 24.0;  // was 18.0
      case 'text-base':
        return 28.0;  // was 20.0
      case 'text-lg':
        return 32.0;  // was 24.0
      case 'text-xl':
        return 40.0;  // was 28.0
      case 'text-2xl':
        return 48.0;  // was 32.0 (old 2XL becomes new base)
      case 'text-3xl':
        return 64.0;  // was 40.0
      case 'text-4xl':
        return 80.0;  // was 48.0
      case 'text-5xl':
        return 96.0;  // was 64.0
      case 'text-6xl':
        return 128.0; // was 80.0
      case 'text-7xl':
        return 160.0; // was 96.0
      case 'text-8xl':
        return 200.0; // was 128.0
      case 'text-9xl':
        return 256.0; // was 160.0
      default:
        return 32.0; // Default to text-lg (was 24.0)
    }
  }
  
  /// Calculate dynamic text size based on ALL lines to fit on one line
  double _getDynamicTextSize() {
    if (slides == null || slides!.pages.isEmpty) {
      return 28.0; // Default fallback (text-base size)
    }
    
    final screenWidth = MediaQuery.of(context).size.width;
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    
    // Collect ALL lines in the current page
    final allLines = <String>[];
    for (final phrase in currentPageData.lines) {
      if (phrase.lyric.trim().isNotEmpty) {
        allLines.add(phrase.lyric);
      }
    }
    
    // Check extra line if it exists
    if (currentPageData.extra != null && currentPageData.extra!.lyric.trim().isNotEmpty) {
      allLines.add(currentPageData.extra!.lyric);
    }
    
    if (allLines.isEmpty) {
      return 18.0; // Default if no lyrics found
    }
    
    // Calculate optimal font size to fit ALL lines
    // Account for left margin (20px) and some padding (40px total)
    final availableWidth = screenWidth - 40;
    
    // Use binary search to find the optimal font size
    double minFontSize = 12.0;
    double maxFontSize = 72.0;
    double optimalFontSize = 18.0; // Default
    
    // Binary search for the largest font size that fits ALL lines
    for (int i = 0; i < 10; i++) { // Limit iterations
      final testFontSize = (minFontSize + maxFontSize) / 2;
      
      // Check if ALL lines fit at this font size
      bool allLinesFit = true;
      for (final line in allLines) {
        final textWidth = _calculateTextWidthForFontSize(line, testFontSize);
        if (textWidth > availableWidth) {
          allLinesFit = false;
          break;
        }
      }
      
      if (allLinesFit) {
        optimalFontSize = testFontSize;
        minFontSize = testFontSize;
      } else {
        maxFontSize = testFontSize;
      }
      
      // Break if we're close enough
      if ((maxFontSize - minFontSize) < 0.5) {
        break;
      }
    }
    
    return optimalFontSize;
  }
  
  /// Calculate text width for a given font size using TextPainter
  double _calculateTextWidthForFontSize(String text, double fontSize) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w900,
          fontFamily: '.SF Pro Text',
          fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
          letterSpacing: 0.3,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    
    textPainter.layout();
    return textPainter.width;
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
