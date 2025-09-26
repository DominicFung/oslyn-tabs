import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/jam_session.dart';
import '../services/jam_service.dart';

/// Widget for managing the song queue with drag-and-drop reordering
class QueueManagementWidget extends StatefulWidget {
  final String jamSessionId;
  final List<int> queue;
  final int queueRevision;
  final JamSession? jamSession;
  final Function(List<int>, int) onQueueUpdated;

  const QueueManagementWidget({
    super.key,
    required this.jamSessionId,
    required this.queue,
    required this.queueRevision,
    required this.onQueueUpdated,
    this.jamSession,
  });

  @override
  State<QueueManagementWidget> createState() => _QueueManagementWidgetState();
}

class _QueueManagementWidgetState extends State<QueueManagementWidget> {
  late List<int> _localQueue;
  late int _localRevision;
  bool _isReordering = false;
  String? _errorMessage;
  late JamService _jamService;

  @override
  void initState() {
    super.initState();
    _jamService = JamService();
    _localQueue = List.from(widget.queue);
    _localRevision = widget.queueRevision;
  }

  @override
  void didUpdateWidget(QueueManagementWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.queue != widget.queue || oldWidget.queueRevision != widget.queueRevision) {
      setState(() {
        _localQueue = List.from(widget.queue);
        _localRevision = widget.queueRevision;
        _isReordering = false;
        _errorMessage = null;
      });
    }
  }

  String _getSongTitle(int songIndex) {
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songsList!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.title; // TODO: Load song details
      }
    }
    return 'Song $songIndex';
  }

  String _getSongArtist(int songIndex) {
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songsList!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.artist; // TODO: Load song details
      }
    }
    return '';
  }

  String? _getAlbumCover(int songIndex) {
    if (widget.jamSession?.setList?.songsList?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songsList!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.albumCover; // TODO: Load song details
      }
    }
    return null;
  }

  Widget _buildAlbumArt(int songIndex) {
    final albumCoverUrl = _getAlbumCover(songIndex);
    
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: albumCoverUrl != null && albumCoverUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: albumCoverUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: const Color(0xFF667eea).withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: const Color(0xFF667eea).withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
              )
            : Container(
                color: const Color(0xFF667eea).withValues(alpha: 0.3),
                child: const Icon(
                  Icons.music_note,
                  color: Colors.white,
                  size: 12,
                ),
              ),
      ),
    );
  }

  Future<void> _reorderQueue(int oldIndex, int newIndex) async {
    if (oldIndex == newIndex) return;

    setState(() {
      _isReordering = true;
      _errorMessage = null;
    });

    // Update local queue
    final item = _localQueue.removeAt(oldIndex);
    _localQueue.insert(newIndex, item);

    // Send to backend with OCC retry
    for (int attempt = 0; attempt < 3; attempt++) {
      try {
        final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
          widget.jamSessionId,
          _localQueue,
          expectedRevision: _localRevision,
        );

        if (serverQueue != null) {
          // Success - update with server state
          setState(() {
            _localQueue = serverQueue;
            _localRevision = serverRev ?? _localRevision;
            _isReordering = false;
          });
          
          // Notify parent
          widget.onQueueUpdated(_localQueue, _localRevision);
          return;
        } else {
          // Retry - get current server state
          final (currentQueue, currentRev, _) = await _jamService.getJamQueue(widget.jamSessionId);
          if (currentQueue != null && currentRev != null) {
            setState(() {
              _localQueue = currentQueue;
              _localRevision = currentRev;
            });
          } else {
            break;
          }
        }
      } catch (e) {
        print('❌ Error reordering queue (attempt ${attempt + 1}): $e');
        if (attempt == 2) {
          setState(() {
            _errorMessage = 'Failed to reorder queue: $e';
            _isReordering = false;
          });
        }
      }
    }
  }

  Future<void> _removeFromQueue(int index) async {
    setState(() {
      _isReordering = true;
      _errorMessage = null;
    });

    // Remove from local queue
    _localQueue.removeAt(index);

    // Send to backend with OCC retry
    for (int attempt = 0; attempt < 3; attempt++) {
      try {
        final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
          widget.jamSessionId,
          _localQueue,
          expectedRevision: _localRevision,
        );

        if (serverQueue != null) {
          // Success - update with server state
          setState(() {
            _localQueue = serverQueue;
            _localRevision = serverRev ?? _localRevision;
            _isReordering = false;
          });
          
          // Notify parent
          widget.onQueueUpdated(_localQueue, _localRevision);
          return;
        } else {
          // Retry - get current server state
          final (currentQueue, currentRev, _) = await _jamService.getJamQueue(widget.jamSessionId);
          if (currentQueue != null && currentRev != null) {
            setState(() {
              _localQueue = currentQueue;
              _localRevision = currentRev;
            });
          } else {
            break;
          }
        }
      } catch (e) {
        print('❌ Error removing from queue (attempt ${attempt + 1}): $e');
        if (attempt == 2) {
          setState(() {
            _errorMessage = 'Failed to remove from queue: $e';
            _isReordering = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_localQueue.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.queue_music_outlined,
              size: 48,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Queue is empty',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add songs to the queue to see them here',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF667eea).withValues(alpha: 0.2),
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(12),
              topRight: Radius.circular(12),
            ),
          ),
          child: Row(
            children: [
              Icon(
                Icons.queue_music,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                'Queue (${_localQueue.length} songs)',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              if (_isReordering)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
            ],
          ),
        ),

        // Error message
        if (_errorMessage != null)
          Container(
            padding: const EdgeInsets.all(8),
            color: Colors.red.shade100,
            child: Row(
              children: [
                Icon(Icons.error_outline, color: Colors.red.shade700, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: 12,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      _errorMessage = null;
                    });
                  },
                  icon: Icon(Icons.close, color: Colors.red.shade700, size: 16),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
                ),
              ],
            ),
          ),

        // Reorderable list
        Expanded(
          child: ReorderableListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: _localQueue.length,
            onReorder: _reorderQueue,
            itemBuilder: (context, index) {
              final songIndex = _localQueue[index];
              final title = _getSongTitle(songIndex);
              final artist = _getSongArtist(songIndex);

              return ReorderableDragStartListener(
                key: ValueKey('queue_$songIndex'),
                index: index,
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () {
                        // Could add tap to play functionality here
                      },
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            // Album art (replacing song number)
                            _buildAlbumArt(songIndex),
                            const SizedBox(width: 12),
                            
                            // Song number (commented out but kept for reference)
                            // Container(
                            //   width: 24,
                            //   height: 24,
                            //   decoration: BoxDecoration(
                            //     color: const Color(0xFF667eea).withValues(alpha: 0.3),
                            //     borderRadius: BorderRadius.circular(12),
                            //   ),
                            //   child: Center(
                            //     child: Text(
                            //       '${index + 1}',
                            //       style: const TextStyle(
                            //         color: Colors.white,
                            //         fontSize: 12,
                            //         fontWeight: FontWeight.w600,
                            //       ),
                            //     ),
                            //   ),
                            // ),
                            // const SizedBox(width: 12),

                          // Song info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (artist.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    artist,
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.7),
                                      fontSize: 12,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Remove button
                          IconButton(
                            onPressed: _isReordering ? null : () => _removeFromQueue(index),
                            icon: Icon(
                              Icons.remove_circle_outline,
                              color: _isReordering 
                                  ? Colors.white.withValues(alpha: 0.3)
                                  : Colors.white.withValues(alpha: 0.7),
                              size: 20,
                            ),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                            tooltip: 'Remove from queue',
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ));
            },
          ),
        ),
      ],
    );
  }
}
