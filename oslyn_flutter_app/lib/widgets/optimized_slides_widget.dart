import 'package:flutter/material.dart';
import '../core/oslyn_types.dart';
import '../core/oslyn_engine.dart';
import 'optimized_line_widget.dart';

/// Optimized slides widget for displaying song lyrics
/// Simplified version with better performance and reduced complexity
class OptimizedSlidesWidget extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final String? originalKey;
  final String textSize;
  final int? page;
  final Function(int)? setPage;
  final Function(bool)? setLastPage;
  final Function(bool)? onCompactModeChanged;
  final Function(String)? onSectionChanged;
  final VoidCallback? onPreviousPage;
  final VoidCallback? onNextPage;
  final bool pt;
  final int capo;

  const OptimizedSlidesWidget({
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
  State<OptimizedSlidesWidget> createState() => OptimizedSlidesWidgetState();
}

class OptimizedSlidesWidgetState extends State<OptimizedSlidesWidget> {
  OslynSlide? slides;
  int currentPage = 0;
  String? originalKey;
  
  // Simplified state for line navigation
  int _currentLineGroup = 0;
  bool _isInLineNavigationMode = false;
  static const int _lineGroupSize = 2;

  @override
  void initState() {
    super.initState();
    currentPage = widget.page ?? 0;
    _processChordSheet();
  }

  @override
  void didUpdateWidget(OptimizedSlidesWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.chordSheet != widget.chordSheet) {
      _processChordSheet();
    }
    if (oldWidget.page != widget.page) {
      setState(() {
        currentPage = widget.page ?? 0;
        _currentLineGroup = 0;
      });
    }
  }

  void _processChordSheet() {
    if (widget.chordSheet.isNotEmpty) {
      originalKey = widget.originalKey ?? widget.chordSheetKey;
      
      try {
        final oslynSlides = OslynEngine.chordSheetToSlides(
          widget.chordSheet,
          originalKey!,
        );
        
        setState(() {
          slides = oslynSlides;
        });
      } catch (e) {
        print('Error processing chord sheet: $e');
        setState(() {
          slides = null;
        });
      }
    } else {
      setState(() {
        slides = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (slides == null || slides!.pages.isEmpty) {
      return _buildErrorState();
    }

    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];

    return _buildCenteredBlock(currentPageData);
  }

  Widget _buildErrorState() {
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
          ],
        ),
      ),
    );
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

    final screenHeight = MediaQuery.of(context).size.height;
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
      return _buildLineNavigationLayout(pageData);
    }

    return _buildNormalLayout(pageData);
  }

  /// Determine if we should use line navigation mode
  bool _shouldUseLineNavigationMode(OslynPage pageData, double screenHeight) {
    final lineCount = pageData.lines.length + (pageData.extra != null ? 1 : 0);
    return screenHeight < 600 || lineCount > _lineGroupSize;
  }

  Widget _buildNormalLayout(OslynPage pageData) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: constraints.maxHeight,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 20),
                ..._buildPageContent(pageData),
                SizedBox(height: _calculateBottomSpacing(pageData.lines.length)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLineNavigationLayout(OslynPage pageData) {
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenHeight < 600;
    final currentLines = _getCurrentLineGroup(pageData);
    
    return LayoutBuilder(
      builder: (context, constraints) {
        if (isSmallScreen) {
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),
                  ..._buildLineGroupContent(currentLines),
                  SizedBox(height: _calculateBottomSpacing(currentLines.length)),
                ],
              ),
            ),
          );
        } else {
          final allLines = <OslynPhrase>[];
          allLines.addAll(pageData.lines);
          if (pageData.extra != null) {
            allLines.add(pageData.extra!);
          }
          
          return SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: constraints.maxHeight,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 20),
                  ..._buildHighlightedLineGroupContent(allLines, currentLines),
                  SizedBox(height: _calculateBottomSpacing(allLines.length)),
                ],
              ),
            ),
          );
        }
      },
    );
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

  List<Widget> _buildPageContent(OslynPage pageData) {
    final widgets = <Widget>[];
    String? lastSection;
    
    // Calculate dynamic font size if needed
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
    // Process main lines
    for (int i = 0; i < pageData.lines.length; i++) {
      final phrase = pageData.lines[i];
      
      // Add section label if section changed
      if (lastSection != phrase.section) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 8),
            child: _buildSectionLabel(phrase.section),
          ),
        );
        lastSection = phrase.section;
      }
      
      // Add the phrase line
      widgets.add(
        Container(
          margin: const EdgeInsets.only(left: 20, right: 20, top: 16),
          child: OptimizedLineWidget(
            phrase: phrase,
            textSize: widget.textSize,
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
      
      if (lastSection != phrase.section) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(left: 20, right: 20, top: 32, bottom: 16),
            child: _buildSectionLabel(phrase.section),
          ),
        );
      }
      
      widgets.add(
        Container(
          margin: const EdgeInsets.only(left: 20, right: 20, top: 16),
          child: OptimizedLineWidget(
            phrase: phrase,
            textSize: widget.textSize,
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

  List<Widget> _buildLineGroupContent(List<OslynPhrase> lines) {
    final widgets = <Widget>[];
    String? lastSection;
    
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
    for (int i = 0; i < lines.length; i++) {
      final phrase = lines[i];
      
      if (lastSection != phrase.section) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 8),
            child: _buildSectionLabel(phrase.section),
          ),
        );
        lastSection = phrase.section;
      }
      
      widgets.add(
        Container(
          margin: const EdgeInsets.only(left: 20, right: 20, top: 16),
          child: OptimizedLineWidget(
            phrase: phrase,
            textSize: widget.textSize,
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

  List<Widget> _buildHighlightedLineGroupContent(List<OslynPhrase> allLines, List<OslynPhrase> currentLines) {
    final widgets = <Widget>[];
    String? lastSection;
    
    final dynamicFontSize = widget.textSize == 'dynamic' ? _getDynamicTextSize() : null;
    
    // Find the start and end indices of the current line group
    final startIndex = _currentLineGroup * _lineGroupSize;
    final endIndex = (startIndex + _lineGroupSize).clamp(0, allLines.length);
    
    for (int i = 0; i < allLines.length; i++) {
      final phrase = allLines[i];
      final isInCurrentGroup = i >= startIndex && i < endIndex;
      
      if (lastSection != phrase.section) {
        widgets.add(
          Container(
            margin: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 8),
            child: _buildSectionLabel(phrase.section),
          ),
        );
        lastSection = phrase.section;
      }
      
      Widget lineWidget = Container(
        margin: const EdgeInsets.only(left: 20, right: 20, top: 16),
        child: OptimizedLineWidget(
          phrase: phrase,
          textSize: widget.textSize,
          chordSheetKey: widget.chordSheetKey,
          originalKey: originalKey,
          capo: widget.capo,
          dynamicFontSize: dynamicFontSize,
        ),
      );
      
      if (isInCurrentGroup) {
        // Wrap in highlight container for current group
        lineWidget = Container(
          margin: const EdgeInsets.only(left: 20, right: 20, top: 16),
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFF8B5CF6).withValues(alpha: 0.8),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.all(12),
          child: OptimizedLineWidget(
            phrase: phrase,
            textSize: widget.textSize,
            chordSheetKey: widget.chordSheetKey,
            originalKey: originalKey,
            capo: widget.capo,
            dynamicFontSize: dynamicFontSize,
          ),
        );
      }
      
      widgets.add(lineWidget);
    }
    
    return widgets;
  }

  Widget _buildSectionLabel(String? section) {
    if (section == null) return const SizedBox.shrink();
    
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
        ),
        child: Text(
          '[$section]',
          style: TextStyle(
            fontSize: _getTextSize(widget.textSize),
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
    if (textSize == 'dynamic') {
      return _getDynamicTextSize();
    }
    
    switch (textSize) {
      case 'text-xs': return 20.0;
      case 'text-sm': return 24.0;
      case 'text-base': return 28.0;
      case 'text-lg': return 32.0;
      case 'text-xl': return 40.0;
      case 'text-2xl': return 48.0;
      case 'text-3xl': return 64.0;
      case 'text-4xl': return 80.0;
      case 'text-5xl': return 96.0;
      case 'text-6xl': return 128.0;
      case 'text-7xl': return 160.0;
      case 'text-8xl': return 200.0;
      case 'text-9xl': return 256.0;
      default: return 32.0;
    }
  }

  double _getDynamicTextSize() {
    if (slides == null || slides!.pages.isEmpty) {
      return 28.0;
    }
    
    final screenWidth = MediaQuery.of(context).size.width;
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    
    // Collect all lines in the current page
    final allLines = <String>[];
    for (final phrase in currentPageData.lines) {
      if (phrase.lyric.trim().isNotEmpty) {
        allLines.add(phrase.lyric);
      }
    }
    
    if (currentPageData.extra != null && currentPageData.extra!.lyric.trim().isNotEmpty) {
      allLines.add(currentPageData.extra!.lyric);
    }
    
    if (allLines.isEmpty) {
      return 18.0;
    }
    
    // Calculate optimal font size to fit all lines
    final availableWidth = screenWidth - 40;
    
    // Use binary search to find the optimal font size
    double minFontSize = 12.0;
    double maxFontSize = 72.0;
    double optimalFontSize = 18.0;
    
    for (int i = 0; i < 10; i++) {
      final testFontSize = (minFontSize + maxFontSize) / 2;
      
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
      
      if ((maxFontSize - minFontSize) < 0.5) {
        break;
      }
    }
    
    return optimalFontSize;
  }

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
    if (lineCount <= 2) return 120.0;
    if (lineCount <= 4) return 80.0;
    if (lineCount <= 6) return 40.0;
    return 20.0;
  }

  /// Navigate to the next line group
  void nextLineGroup() {
    if (slides == null || slides!.pages.isEmpty) return;
    
    final safeCurrentPage = currentPage.clamp(0, slides!.pages.length - 1);
    final currentPageData = slides!.pages[safeCurrentPage];
    final totalGroups = _getTotalLineGroups(currentPageData);
    
    if (_currentLineGroup < totalGroups - 1) {
      setState(() {
        _currentLineGroup++;
      });
    } else {
      widget.onNextPage?.call();
      setState(() {
        _currentLineGroup = 0;
      });
    }
  }

  /// Navigate to the previous line group
  void previousLineGroup() {
    if (_currentLineGroup > 0) {
      setState(() {
        _currentLineGroup--;
      });
    } else {
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

  int _getTotalLineGroups(OslynPage pageData) {
    final lineCount = pageData.lines.length + (pageData.extra != null ? 1 : 0);
    return (lineCount / _lineGroupSize).ceil();
  }

  /// Get current line group info
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
}
