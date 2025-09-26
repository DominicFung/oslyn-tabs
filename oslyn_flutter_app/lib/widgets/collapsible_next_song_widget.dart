import 'package:flutter/material.dart';
import '../models/jam_session.dart';
import 'song_selector_widget.dart';

class CollapsibleNextSongWidget extends StatefulWidget {
  final JamSession? jamSession;
  final int currentSongIndex;
  final Function(int) onSongSelected;
  final Function(int, int)? onPlayNext;
  final Function(int)? onAddToQueue;
  // Queue management
  final List<int>? queue;
  final int? nextSongIndex;

  const CollapsibleNextSongWidget({
    super.key,
    required this.jamSession,
    required this.currentSongIndex,
    required this.onSongSelected,
    this.onPlayNext,
    this.onAddToQueue,
    this.queue,
    this.nextSongIndex,
  });

  @override
  State<CollapsibleNextSongWidget> createState() => _CollapsibleNextSongWidgetState();
}

class _CollapsibleNextSongWidgetState extends State<CollapsibleNextSongWidget>
    with SingleTickerProviderStateMixin {
  bool _isExpanded = false;
  late AnimationController _animationController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _animationController.forward();
      } else {
        _animationController.reverse();
      }
    });
  }

  String _getNextSongTitle({int? queueIndex}) {
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songsList!;
      
      // Check if we have a queue and nextSongIndex is not null
      if (widget.queue != null && widget.queue!.isNotEmpty) {
        // Check if nextSongIndex is null (current song is last in queue)
        if (widget.nextSongIndex == null) {
          return 'No next song';
        } else if (widget.nextSongIndex! >= 0 && 
                   widget.nextSongIndex! < widget.queue!.length) {
          // nextSongIndex is now a queue position, get the setlist index from queue
          final setlistIndex = widget.queue![widget.nextSongIndex!];
          if (setlistIndex >= 0 && setlistIndex < songs.length) {
            final title = songs[setlistIndex].song.title;
            final queuePos = queueIndex != null ? ' (Queue #${queueIndex + 1})' : '';
            return '$title$queuePos';
          }
        }
        return 'No next song';
      }
      
      // When queue is empty, always show "No next song" - don't fallback to sequential navigation
      return 'No next song';
    }
    return 'No songs in set';
  }

  int _getTotalSongs() {
    return widget.jamSession?.setList?.songsList?.length ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _expandAnimation,
      builder: (context, child) {
        return Container(
          width: _isExpanded ? 260 : 50,
          padding: EdgeInsets.all(_isExpanded ? 12 : 8),
          decoration: BoxDecoration(
            color: const Color(0xFFC8A2C8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: const Color(0xFFC8A2C8),
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFa8edea).withValues(alpha: 0.2),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: _isExpanded ? _buildExpandedContent() : _buildCollapsedContent(),
        );
      },
    );
  }

  Widget _buildCollapsedContent() {
    return GestureDetector(
      onTap: _toggleExpanded,
      child: Container(
        height: 34,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.queue_music_rounded,
              color: Colors.white,
              size: 16,
            ),
            const SizedBox(height: 2),
            Icon(
              Icons.open_in_new, // popup-style icon for collapsed hint
              color: Colors.white.withValues(alpha: 0.7),
              size: 12,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExpandedContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header with collapse button
        Row(
          children: [
            Icon(
              Icons.queue_music_rounded,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Next Song:',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            GestureDetector(
              onTap: _toggleExpanded,
              child: Container(
                padding: const EdgeInsets.all(4),
                child: Icon(
                  Icons.open_in_new, // popup-style icon
                  color: Colors.white.withValues(alpha: 0.7),
                  size: 16,
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 8),
        
        // Next song title
        Text(
          _getNextSongTitle(queueIndex: widget.nextSongIndex),
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.9),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
        ),
        
        const SizedBox(height: 8),
        
        // Song selector button
        if (widget.jamSession?.setList?.songsList?.isNotEmpty == true)
          SongSelectorWidget(
            songs: widget.jamSession!.setList!.songsList!,
            currentSongIndex: widget.currentSongIndex,
            onSongSelected: widget.onSongSelected,
            buttonText: 'Select the next song',
            onPlayNext: widget.onPlayNext,
            onAddToQueue: widget.onAddToQueue,
          ),
        
        const SizedBox(height: 4),
        
        // Song count
        Text(
          '${_getTotalSongs()} songs in set',
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

