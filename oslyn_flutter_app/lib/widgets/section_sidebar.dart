import 'package:flutter/material.dart';
import '../core/oslyn_engine.dart';

/// Sidebar widget for navigating between song sections
class SectionSidebar extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final int currentPage;
  final Function(int) onSectionSelected;
  final SidebarPosition position;
  final bool isVisible;

  const SectionSidebar({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    required this.currentPage,
    required this.onSectionSelected,
    this.position = SidebarPosition.right,
    this.isVisible = true,
  });

  @override
  State<SectionSidebar> createState() => _SectionSidebarState();
}

class _SectionSidebarState extends State<SectionSidebar> {
  List<SectionInfo> _sections = [];
  int _currentSectionIndex = 0;

  @override
  void initState() {
    super.initState();
    _extractSections();
  }

  @override
  void didUpdateWidget(SectionSidebar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.chordSheet != widget.chordSheet || 
        oldWidget.chordSheetKey != widget.chordSheetKey) {
      _extractSections();
    }
    if (oldWidget.currentPage != widget.currentPage) {
      _updateCurrentSection();
    }
  }

  void _extractSections() {
    if (widget.chordSheet.isEmpty) {
      setState(() {
        _sections = [];
      });
      return;
    }

    try {
      final oslynSlides = OslynEngine.chordSheetToSlides(widget.chordSheet, widget.chordSheetKey);
      final sections = <SectionInfo>[];
      
      // Group consecutive pages by section name
      String? currentSectionName;
      int sectionStartPage = 0;
      int sectionPageCount = 0;
      
      for (int pageIndex = 0; pageIndex < oslynSlides.pages.length; pageIndex++) {
        final page = oslynSlides.pages[pageIndex];
        if (page.lines.isNotEmpty) {
          final sectionName = page.lines.first.section;
          
          if (currentSectionName == null) {
            // First section
            currentSectionName = sectionName;
            sectionStartPage = pageIndex;
            sectionPageCount = 1;
          } else if (currentSectionName == sectionName) {
            // Same section, increment page count
            sectionPageCount++;
          } else {
            // New section, add the previous section's pages
            _addSectionPages(sections, currentSectionName, sectionStartPage, sectionPageCount);
            
            // Start new section
            currentSectionName = sectionName;
            sectionStartPage = pageIndex;
            sectionPageCount = 1;
          }
        }
      }
      
      // Add the last section
      if (currentSectionName != null) {
        _addSectionPages(sections, currentSectionName, sectionStartPage, sectionPageCount);
      }
      
      setState(() {
        _sections = sections;
        _updateCurrentSection();
      });
    } catch (e) {
      print('Error extracting sections: $e');
      setState(() {
        _sections = [];
      });
    }
  }

  void _addSectionPages(List<SectionInfo> sections, String sectionName, int startPage, int pageCount) {
    if (pageCount == 1) {
      // Single page section
      final lyricPreview = _getLyricPreview(startPage);
      sections.add(SectionInfo(
        name: sectionName,
        originalName: sectionName,
        startPage: startPage,
        endPage: startPage,
        pageInSection: 1,
        totalPagesInSection: 1,
        lyricPreview: lyricPreview,
      ));
    } else {
      // Multi-page section - create entries for each page
      for (int i = 0; i < pageCount; i++) {
        final lyricPreview = _getLyricPreview(startPage + i);
        sections.add(SectionInfo(
          name: sectionName,
          originalName: sectionName,
          startPage: startPage + i,
          endPage: startPage + i,
          pageInSection: i + 1,
          totalPagesInSection: pageCount,
          lyricPreview: lyricPreview,
        ));
      }
    }
  }

  String _getLyricPreview(int pageIndex) {
    try {
      final oslynSlides = OslynEngine.chordSheetToSlides(widget.chordSheet, widget.chordSheetKey);
      if (pageIndex < oslynSlides.pages.length) {
        final page = oslynSlides.pages[pageIndex];
        
        // Get the first non-empty lyric line
        for (final phrase in page.lines) {
          final lyric = phrase.lyric.trim();
          if (lyric.isNotEmpty) {
            // Extract first few words (up to 4 words or 30 characters)
            final words = lyric.split(' ');
            if (words.length <= 4) {
              return lyric;
            } else {
              final preview = words.take(4).join(' ');
              return preview.length <= 30 ? preview : '${preview.substring(0, 27)}...';
            }
          }
        }
      }
    } catch (e) {
      print('Error getting lyric preview: $e');
    }
    return '';
  }

  void _updateCurrentSection() {
    for (int i = 0; i < _sections.length; i++) {
      final section = _sections[i];
      if (widget.currentPage >= section.startPage && widget.currentPage <= section.endPage) {
        setState(() {
          _currentSectionIndex = i;
        });
        break;
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    if (!widget.isVisible || _sections.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      width: widget.position == SidebarPosition.left || widget.position == SidebarPosition.right ? 200 : null,
      height: widget.position == SidebarPosition.bottom ? 120 : null,
      decoration: BoxDecoration(
        color: Color(0xFF8B7ED8).withValues(alpha: 0.9),
        borderRadius: _getBorderRadius(),
        border: Border.all(
          color: Color(0xFF667eea).withValues(alpha: 0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: _buildContent(),
    );
  }

  BorderRadius _getBorderRadius() {
    switch (widget.position) {
      case SidebarPosition.left:
        return const BorderRadius.only(
          topRight: Radius.circular(12),
          bottomRight: Radius.circular(12),
        );
      case SidebarPosition.right:
        return const BorderRadius.only(
          topLeft: Radius.circular(12),
          bottomLeft: Radius.circular(12),
        );
      case SidebarPosition.bottom:
        return const BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
        );
    }
  }

  Widget _buildContent() {
    if (widget.position == SidebarPosition.bottom) {
      return _buildHorizontalList();
    } else {
      return _buildVerticalList();
    }
  }

  Widget _buildVerticalList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Color(0xFF667eea).withValues(alpha: 0.2),
            borderRadius: _getBorderRadius(),
          ),
          child: Row(
            children: [
              Icon(
                Icons.list_alt,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Sections',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: _sections.length,
            itemBuilder: (context, index) {
              final section = _sections[index];
              final isSelected = index == _currentSectionIndex;
              
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => widget.onSectionSelected(section.startPage),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected 
                          ? Color(0xFF667eea).withValues(alpha: 0.3)
                          : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                        border: isSelected 
                          ? Border.all(
                              color: Color(0xFF667eea).withValues(alpha: 0.5),
                              width: 1,
                            )
                          : null,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            section.totalPagesInSection > 1 
                              ? '[${section.name}] ${section.pageInSection}/${section.totalPagesInSection}'
                              : '[${section.name}]',
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.8),
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (section.lyricPreview.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              section.lyricPreview,
                              style: TextStyle(
                                color: isSelected 
                                  ? Colors.white.withValues(alpha: 0.8)
                                  : Colors.white.withValues(alpha: 0.6),
                                fontSize: 10,
                                fontWeight: FontWeight.w400,
                                fontStyle: FontStyle.italic,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildHorizontalList() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Color(0xFF667eea).withValues(alpha: 0.2),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.list_alt,
                color: Colors.white,
                size: 14,
              ),
              const SizedBox(width: 6),
              Text(
                'Sections',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            itemCount: _sections.length,
            itemBuilder: (context, index) {
              final section = _sections[index];
              final isSelected = index == _currentSectionIndex;
              
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => widget.onSectionSelected(section.startPage),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                      decoration: BoxDecoration(
                        color: isSelected 
                          ? Color(0xFF667eea).withValues(alpha: 0.3)
                          : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                        border: isSelected 
                          ? Border.all(
                              color: Color(0xFF667eea).withValues(alpha: 0.5),
                              width: 1,
                            )
                          : null,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            section.totalPagesInSection > 1 
                              ? '[${section.name}] ${section.pageInSection}/${section.totalPagesInSection}'
                              : '[${section.name}]',
                            style: TextStyle(
                              color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.8),
                              fontSize: 10,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (section.lyricPreview.isNotEmpty) ...[
                            const SizedBox(height: 1),
                            Text(
                              section.lyricPreview,
                              style: TextStyle(
                                color: isSelected 
                                  ? Colors.white.withValues(alpha: 0.8)
                                  : Colors.white.withValues(alpha: 0.6),
                                fontSize: 8,
                                fontWeight: FontWeight.w400,
                                fontStyle: FontStyle.italic,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class SectionInfo {
  final String name;
  final String originalName;
  final int startPage;
  final int endPage;
  final int pageInSection;
  final int totalPagesInSection;
  final String lyricPreview;

  SectionInfo({
    required this.name,
    required this.originalName,
    required this.startPage,
    required this.endPage,
    required this.pageInSection,
    required this.totalPagesInSection,
    required this.lyricPreview,
  });
}

enum SidebarPosition {
  left,
  right,
  bottom,
}
