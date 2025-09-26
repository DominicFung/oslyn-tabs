import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/oslyn_engine.dart';
import '../models/jam_session.dart';
import 'queue_management.dart';

/// Sidebar widget for navigating between song sections
class SectionSidebar extends StatefulWidget {
  final String chordSheet;
  final String chordSheetKey;
  final int currentPage;
  final Function(int) onSectionSelected;
  final SidebarPosition position;
  final bool isVisible;
  // Next song functionality
  final JamSession? jamSession;
  final int? currentSongIndex;
  final int? nextSongIndex; // optional override derived from queue
  final Function(int)? onSongSelected;
  final Function(int, int)? onPlayNext;
  final Function(int)? onAddToQueue;
  
  // Queue management
  final List<int>? queue;
  final int? queueRevision;
  final Function(List<int>, int)? onQueueUpdated;
  final Function(int?)? onCurrentSongChanged;
  

  const SectionSidebar({
    super.key,
    required this.chordSheet,
    required this.chordSheetKey,
    required this.currentPage,
    required this.onSectionSelected,
    this.position = SidebarPosition.right,
    this.isVisible = true,
    this.jamSession,
    this.currentSongIndex,
    this.nextSongIndex,
    this.onSongSelected,
    this.onPlayNext,
    this.onAddToQueue,
    this.queue,
    this.queueRevision,
    this.onQueueUpdated,
    this.onCurrentSongChanged,
  });

  @override
  State<SectionSidebar> createState() => _SectionSidebarState();
}

class _SectionSidebarState extends State<SectionSidebar> {
  List<SectionInfo> _sections = [];
  int _currentSectionIndex = 0;
  final ScrollController _scrollController = ScrollController();
  bool _showScrollDownIndicator = false;
  bool _showScrollUpIndicator = false;
  

  @override
  void initState() {
    super.initState();
    _extractSections();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.hasClients) {
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      final threshold = 50.0; // Show indicator when 50 pixels from edge
      
      setState(() {
        // Show down indicator when not near bottom
        _showScrollDownIndicator = currentScroll < (maxScroll - threshold);
        // Show up indicator when not near top
        _showScrollUpIndicator = currentScroll > threshold;
      });
    }
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
    
    // Clear cache if relevant data changed
    if (oldWidget.currentSongIndex != widget.currentSongIndex ||
        oldWidget.nextSongIndex != widget.nextSongIndex ||
        oldWidget.queue != widget.queue) {
      _cachedNextSongTitle = null;
      _cachedPreviousSongTitle = null;
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
      
      // Check scroll indicator after sections are loaded
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _checkScrollIndicator();
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

  // Next song helper methods - cached for performance
  String? _cachedNextSongTitle;
  int? _cachedNextSongIndex;
  int? _cachedQueueIndex;
  
  String _getNextSongTitle({int? queueIndex}) {
    // Return cached result if nothing has changed
    if (_cachedNextSongTitle != null && 
        _cachedNextSongIndex == widget.nextSongIndex && 
        _cachedQueueIndex == queueIndex) {
      return _cachedNextSongTitle!;
    }
    
    String result = 'No songs in set';
    
    // If we have a queue, only check the queue for next song
    if (widget.queue != null && widget.queue!.isNotEmpty) {
      if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
        final songs = widget.jamSession!.setList!.songsList!;
        
        // Check if nextSongIndex is null (current song is last in queue)
        if (widget.nextSongIndex == null) {
          result = 'No next song';
        } else if (widget.nextSongIndex! >= 0 && 
                   widget.nextSongIndex! < widget.queue!.length) {
          // nextSongIndex is now a queue position, get the setlist index from queue
          final setlistIndex = widget.queue![widget.nextSongIndex!];
          if (setlistIndex >= 0 && setlistIndex < songs.length) {
            final title = songs[setlistIndex].song.title;
            final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
            result = '$title$queuePos';
          } else {
            result = 'No next song';
          }
        } else {
          result = 'No next song';
        }
      } else {
        result = 'No next song';
      }
    } else {
      // When queue is empty, always show "No next song" - don't fallback to sequential navigation
      result = 'No next song';
    }
    
    // Cache the result
    _cachedNextSongTitle = result;
    _cachedNextSongIndex = widget.nextSongIndex;
    _cachedQueueIndex = queueIndex;
    
    return result;
  }

  // Previous song helper methods - cached for performance
  String? _cachedPreviousSongTitle;
  int? _cachedPreviousSongIndex;
  int? _cachedPreviousQueueIndex;
  
  String _getPreviousSongTitle({int? queueIndex}) {
    // Return cached result if nothing has changed
    if (_cachedPreviousSongTitle != null && 
        _cachedPreviousSongIndex == widget.currentSongIndex && 
        _cachedPreviousQueueIndex == queueIndex) {
      return _cachedPreviousSongTitle!;
    }
    
    String result = 'No songs in set';
    
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songsList!;
      
      // Use queue-based previous song if available
      if (widget.currentSongIndex != null && 
          widget.currentSongIndex! > 0 && 
          widget.queue != null &&
          widget.currentSongIndex! < widget.queue!.length) {
        // currentSongIndex is the queue position, get the previous song from queue
        final previousQueueIndex = widget.currentSongIndex! - 1;
        if (previousQueueIndex >= 0 && previousQueueIndex < widget.queue!.length) {
          final setlistIndex = widget.queue![previousQueueIndex];
          if (setlistIndex >= 0 && setlistIndex < songs.length) {
            final title = songs[setlistIndex].song.title;
            final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
            result = '$title$queuePos';
          }
        }
      } else if (widget.currentSongIndex != null && widget.currentSongIndex! > 0) {
        // Fallback to sequential navigation
        final title = songs[widget.currentSongIndex! - 1].song.title;
        final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
        result = '$title$queuePos';
      } else {
        result = 'No previous song';
      }
    }
    
    // Cache the result
    _cachedPreviousSongTitle = result;
    _cachedPreviousSongIndex = widget.currentSongIndex;
    _cachedPreviousQueueIndex = queueIndex;
    
    return result;
  }

  bool _hasNextSongFeature() {
    return widget.jamSession != null && 
           widget.currentSongIndex != null && 
           widget.onSongSelected != null;
  }

  bool _hasNextSong() {
    // If we have a queue, only check the queue for next song
    if (widget.queue != null && widget.queue!.isNotEmpty) {
      // Use queue-based next song if available
      if (widget.nextSongIndex != null && 
          widget.nextSongIndex! >= 0 && 
          widget.nextSongIndex! < widget.queue!.length) {
        return true;
      }
      return false; // No next song in queue
    }
    
    // When queue is empty, always return false - don't fallback to sequential navigation
    return false;
  }

  bool _hasPreviousSong() {
    return widget.currentSongIndex != null && widget.currentSongIndex! > 0;
  }

  void _goToNextSong() {
    if (_hasNextSong()) {
      // Use queue-based next song if available, otherwise fallback to sequential
      final nextIndex = widget.nextSongIndex ?? (widget.currentSongIndex! + 1);
      widget.onSongSelected?.call(nextIndex);
    }
  }

  void _goToPreviousSong() {
    if (_hasPreviousSong()) {
      final prevIndex = widget.currentSongIndex! - 1;
      widget.onSongSelected?.call(prevIndex);
    }
  }

  void _openSongSelector() {
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      // Show the queue management interface
      showModalBottomSheet(
        context: context,
        backgroundColor: Colors.transparent,
        isScrollControlled: true,
        showDragHandle: false,
        builder: (BuildContext context) {
          print('🔍 QUEUE MANAGEMENT DEBUG:');
          print('   - currentSongIndex: ${widget.currentSongIndex}');
          print('   - queue: ${widget.queue}');
          print('   - queueRevision: ${widget.queueRevision}');
          return QueueManagement(
            jamSession: widget.jamSession,
            currentSongIndex: widget.currentSongIndex,
            queue: widget.queue,
            queueRevision: widget.queueRevision,
            onQueueUpdated: widget.onQueueUpdated,
            onSongSelected: widget.onSongSelected,
            onCurrentSongChanged: widget.onCurrentSongChanged,
          );
        },
      );
    }
  }


  void _checkScrollIndicator() {
    if (_scrollController.hasClients) {
      final maxScroll = _scrollController.position.maxScrollExtent;
      final currentScroll = _scrollController.position.pixels;
      final threshold = 50.0;
      
      setState(() {
        _showScrollDownIndicator = maxScroll > threshold;
        _showScrollUpIndicator = currentScroll > threshold;
      });
    }
  }

  void _scrollDown() {
    if (_scrollController.hasClients) {
      final currentScroll = _scrollController.position.pixels;
      final maxScroll = _scrollController.position.maxScrollExtent;
      final viewportHeight = _scrollController.position.viewportDimension;
      
      // Scroll down by viewport height, but don't exceed max scroll
      final targetScroll = (currentScroll + viewportHeight * 0.8).clamp(0.0, maxScroll);
      
      _scrollController.animateTo(
        targetScroll,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _scrollUp() {
    if (_scrollController.hasClients) {
      final currentScroll = _scrollController.position.pixels;
      final viewportHeight = _scrollController.position.viewportDimension;
      
      // Scroll up by viewport height, but don't go below 0
      final targetScroll = (currentScroll - viewportHeight * 0.8).clamp(0.0, double.infinity);
      
      _scrollController.animateTo(
        targetScroll,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
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
        color: Colors.transparent, // Remove overlay for full transparency
        borderRadius: _getBorderRadius(),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2), // Subtle white border
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: _getBorderRadius(),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), // Frosted glass effect
          child: _buildContent(),
        ),
      ),
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
    return _buildSectionsContent();
  }

  Widget _buildSectionsContent() {
    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Icon(
                Icons.list,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Controls',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        
        // Next song section (moved below Controls)
        if (_hasNextSongFeature()) _buildNextSongSection(),
        
        // Sections list
        Expanded(
          child: Stack(
            children: [
              ListView.builder(
                controller: _scrollController,
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
              
              // Scroll down indicator
              if (_showScrollDownIndicator)
                Positioned(
                  bottom: 16,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: _scrollDown,
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.keyboard_arrow_down,
                          color: Color(0xFF667eea),
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                ),
              
              // Scroll up indicator
              if (_showScrollUpIndicator)
                Positioned(
                  top: 16,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: GestureDetector(
                      onTap: _scrollUp,
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.keyboard_arrow_up,
                          color: Color(0xFF667eea),
                          size: 24,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNextSongSection() {
    return Container(
      margin: const EdgeInsets.fromLTRB(8, 8, 8, 4),
      child: Column(
        children: [
          // Next song display
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: _openSongSelector,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFC8A2C8).withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFFC8A2C8).withValues(alpha: 0.5),
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Next: ${_getNextSongTitle(queueIndex: widget.nextSongIndex)}',
                        style: TextStyle(
                          color: _hasNextSong() 
                              ? Colors.white
                              : Colors.grey.withValues(alpha: 0.5),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    Icon(
                      Icons.open_in_new, // popup-style icon
                      color: Colors.white.withValues(alpha: 0.7),
                      size: 16,
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SizedBox(height: 8),
          
          // Arrow buttons and song titles
          Row(
            children: [
              // Previous song button and title
              Expanded(
                child: Column(
                  children: [
                    // Previous arrow button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _hasPreviousSong() ? _goToPreviousSong : null,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: _hasPreviousSong() 
                                ? const Color(0xFF667eea).withValues(alpha: 0.3)
                                : Colors.grey.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: _hasPreviousSong() 
                                  ? const Color(0xFF667eea).withValues(alpha: 0.5)
                                  : Colors.grey.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            Icons.arrow_back_ios,
                            color: _hasPreviousSong() 
                                ? Colors.white 
                                : Colors.grey.withValues(alpha: 0.5),
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Previous song title
                    Builder(
                      builder: (context) {
                        final previousQueueIndex = widget.currentSongIndex != null && widget.currentSongIndex! > 0 ? widget.currentSongIndex! - 1 : null;
                        final previousSongTitle = _getPreviousSongTitle(queueIndex: previousQueueIndex);
                        return Text(
                          previousSongTitle.length > 15 
                              ? '${previousSongTitle.substring(0, 15)}...'
                              : previousSongTitle,
                          style: TextStyle(
                            color: _hasPreviousSong() 
                                ? Colors.white.withValues(alpha: 0.8)
                                : Colors.grey.withValues(alpha: 0.5),
                            fontSize: 10,
                            fontWeight: FontWeight.w400,
                          ),
                          textAlign: TextAlign.center,
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        );
                      },
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Next song button and title
              Expanded(
                child: Column(
                  children: [
                    // Next arrow button
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _hasNextSong() ? _goToNextSong : null,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: _hasNextSong() 
                                ? const Color(0xFF667eea).withValues(alpha: 0.3)
                                : Colors.grey.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: _hasNextSong() 
                                  ? const Color(0xFF667eea).withValues(alpha: 0.5)
                                  : Colors.grey.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            Icons.arrow_forward_ios,
                            color: _hasNextSong() 
                                ? Colors.white 
                                : Colors.grey.withValues(alpha: 0.5),
                            size: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    // Next song title
                    Text(
                      _getNextSongTitle(queueIndex: widget.nextSongIndex).length > 15 
                          ? '${_getNextSongTitle(queueIndex: widget.nextSongIndex).substring(0, 15)}...'
                          : _getNextSongTitle(queueIndex: widget.nextSongIndex),
                      style: TextStyle(
                        color: _hasNextSong() 
                            ? Colors.white.withValues(alpha: 0.8)
                            : Colors.grey.withValues(alpha: 0.5),
                        fontSize: 10,
                        fontWeight: FontWeight.w400,
                      ),
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
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
                'Controls',
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