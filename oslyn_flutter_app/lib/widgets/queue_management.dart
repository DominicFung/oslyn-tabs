import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/jam_session.dart';
import '../services/jam_service.dart';

/// Queue management widget for handling song queue operations
class QueueManagement extends StatefulWidget {
  final JamSession? jamSession;
  final int? currentSongIndex;
  final List<int>? queue;
  final int? queueRevision;
  final Function(List<int>, int)? onQueueUpdated;
  final Function(int)? onSongSelected;
  final Function(int?)? onCurrentSongChanged;

  const QueueManagement({
    super.key,
    this.jamSession,
    this.currentSongIndex,
    this.queue,
    this.queueRevision,
    this.onQueueUpdated,
    this.onSongSelected,
    this.onCurrentSongChanged,
  });

  @override
  State<QueueManagement> createState() => _QueueManagementState();
}

class _QueueManagementState extends State<QueueManagement> with TickerProviderStateMixin {
  // Queue management
  late JamService _jamService;
  List<int> _localQueue = [];
  int _localRevision = 0;
  bool _isReordering = false;
  bool _isResetting = false;
  String? _errorMessage;
  
  // Search functionality
  String _searchQuery = '';
  List<int> _filteredQueueIndices = [];
  final TextEditingController _searchController = TextEditingController();
  
  // Scroll controller for the queue list
  final ScrollController _scrollController = ScrollController();
  
  // Cached full queue for O(1) access
  List<int>? _cachedFullQueue;
  
  // Local current song index for immediate UI updates
  int? _localCurrentSongIndex;
  
  // Tab controller for Queue/Setlist tabs
  late TabController _tabController;
  
  // Getter for full queue - O(1) after first access
  List<int> get fullQueue {
    _cachedFullQueue ??= List.generate(
      widget.jamSession?.setList?.songs?.length ?? 0, 
      (index) => index
    );
    return _cachedFullQueue!;
  }

  @override
  void initState() {
    super.initState();
    _jamService = JamService();
    _localQueue = widget.queue ?? [];
    _localRevision = widget.queueRevision ?? 0;
    _localCurrentSongIndex = widget.currentSongIndex;
    _tabController = TabController(length: 2, vsync: this);
    print('🔍 QUEUE INIT: Initializing queue management');
    print('   - Incoming queue: ${widget.queue}');
    print('   - Queue length: ${_localQueue.length}');
    print('   - Setlist length: ${widget.jamSession?.setList?.songs?.length ?? 0}');
    print('   - Current song index: ${widget.currentSongIndex}');
    _filterSongs();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(QueueManagement oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.queue != widget.queue || 
        oldWidget.queueRevision != widget.queueRevision ||
        oldWidget.currentSongIndex != widget.currentSongIndex) {
      setState(() {
        _localQueue = widget.queue ?? [];
        _localRevision = widget.queueRevision ?? 0;
        _localCurrentSongIndex = widget.currentSongIndex;
        _isReordering = false;
        _errorMessage = null;
        _filterSongs();
      });
    }
  }

  void _filterSongs() {
    if (_searchQuery.isEmpty) {
      _filteredQueueIndices = List.generate(_localQueue.length, (index) => index);
    } else {
      _filteredQueueIndices = [];
      for (int i = 0; i < _localQueue.length; i++) {
        final songIndex = _localQueue[i];
        if (widget.jamSession?.setList?.songs != null && 
            songIndex < widget.jamSession!.setList!.songs!.length) {
          final song = widget.jamSession!.setList!.songs![songIndex].song;
          if (song.title.toLowerCase().contains(_searchQuery.toLowerCase())) {
            _filteredQueueIndices.add(i);
          }
        }
      }
    }
    print('🔍 FILTERED INDICES: ${_filteredQueueIndices.length} items (queue length: ${_localQueue.length})');
  }

  // Queue management methods
  /// Reorders items in the song queue based on drag-and-drop operations.
  /// 
  /// This method handles the reordering of songs in the queue when users drag and drop
  /// items in the ReorderableListView. It converts filtered display indices to actual
  /// queue indices, performs the reordering operation, updates the current song position,
  /// and synchronizes changes with the backend server.
  /// 
  /// **Key Operations:**
  /// - Converts filtered indices to actual queue positions using `_filteredQueueIndices`
  /// - Removes the dragged item from its original position
  /// - Adjusts the target index to account for array shift after removal
  /// - Inserts the item at the new position
  /// - Updates the current song index if it was affected by the reordering
  /// - Synchronizes changes with the backend via `_jamService.setJamQueue`
  /// 
  /// **Parameters:**
  /// - `oldIndex`: The original position of the dragged item in the filtered/displayed list
  /// - `newIndex`: The target position where the item should be dropped in the filtered list
  /// 
  /// **Race Condition Protection:**
  /// - Returns immediately if `_isReordering` is true to prevent concurrent operations
  /// 
  /// **State Management:**
  /// - Sets `_isReordering = true` during operation to prevent concurrent calls
  /// - Updates `_localQueue` with the new order
  /// - Increments `_localRevision` for conflict resolution
  /// - Calls `widget.onQueueUpdated` to notify parent components
  /// - Calls `widget.onCurrentSongChanged` if the current song position changed
  /// 
  /// **Error Handling:**
  /// - Catches and logs any errors during the operation
  /// - Sets `_errorMessage` for user feedback
  /// - Always resets `_isReordering = false` in the finally block
  /// 
  /// **Example:**
  /// ```dart
  /// // User drags item from position 1 to position 3 in the filtered list
  /// await _reorderQueue(1, 3);
  /// ```
  Future<void> _reorderQueue(int oldIndex, int newIndex) async {
    print('🎯 TAB DROPPED: Song dropped at position $newIndex');
    print('   - Original position: $oldIndex');
    print('   - Drop position: $newIndex');
    
    // Get song details for the moved song
    if (_filteredQueueIndices.isNotEmpty && oldIndex < _filteredQueueIndices.length) {
      final songIndex = _localQueue[_filteredQueueIndices[oldIndex]];
      final songTitle = _getSongTitle(songIndex);
      final songArtist = _getSongArtist(songIndex);
      print('   - Song being moved: $songIndex');
      print('   - Song title: "$songTitle"');
      print('   - Song artist: "$songArtist"');
    } else {
      print('   - Song being moved: Unknown (invalid indices)');
    }
    print('🚨 REORDER FUNCTION CALLED! oldIndex: $oldIndex, newIndex: $newIndex');
    if (_isReordering) return;
    
    print('🔄 REORDER START:');
    print('   - Old index (filtered): $oldIndex');
    print('   - New index (filtered): $newIndex');
    print('   - Current queue: $_localQueue');
    print('   - Filtered indices: $_filteredQueueIndices');
    print('   - Queue length: ${_localQueue.length}');
    print('   - Filtered length: ${_filteredQueueIndices.length}');
    
    setState(() {
      _isReordering = true;
      _errorMessage = null;
    });

    try {
      // Convert filtered indices to actual queue indices
      final oldQueueIndex = _filteredQueueIndices[oldIndex];
      final newQueueIndex = _filteredQueueIndices[newIndex];
      
      print('   - Old queue index: $oldQueueIndex');
      print('   - New queue index: $newQueueIndex');
      
      // Note: We no longer need to track the current song by setlist index
      // since we're using position-based logic instead
      
      // Calculate new current song index after reordering
      int? newCurrentSongIndex = _localCurrentSongIndex;
      
      // Update local queue - use proper drag-and-drop logic
      if (oldQueueIndex != newQueueIndex) {
        // Remove item from old position
        final item = _localQueue.removeAt(oldQueueIndex);
        
        // Adjust newIndex if we removed an item before the target position
        final adjustedNewIndex = oldQueueIndex < newQueueIndex ? newQueueIndex - 1 : newQueueIndex;
        
        // Insert item at new position
        _localQueue.insert(adjustedNewIndex, item);
        
        print('🔄 Reorder: Moved item from position $oldQueueIndex to $adjustedNewIndex');
        
        // Calculate new current song index after reordering
        if (_localCurrentSongIndex != null && _localCurrentSongIndex! >= 0) {
          print('🔄 CURRENT SONG TRACKING: Original=$_localCurrentSongIndex, Moved from $oldQueueIndex to $adjustedNewIndex');
          
          final currentIndex = _localCurrentSongIndex!;
          
          // Check if the current song itself is being moved
          if (oldQueueIndex == currentIndex) {
            // The current song is being moved to a new position
            newCurrentSongIndex = adjustedNewIndex;
            print('   - CURRENT SONG MOVED: $oldQueueIndex → $adjustedNewIndex');
          } else if (oldQueueIndex > currentIndex && newQueueIndex <= currentIndex) {
            // Moving something from after current song to before/at current song position
            newCurrentSongIndex = currentIndex + 1;
            print('   - Rule 2: After current song moved, new index: $currentIndex → $newCurrentSongIndex');
          } else if (oldQueueIndex < currentIndex && newQueueIndex >= currentIndex) {
            // Moving something from before current song to after/at current song position
            newCurrentSongIndex = currentIndex - 1;
            print('   - Rule 3: Before current song moved, new index: $currentIndex → $newCurrentSongIndex');
          } else {
            // Moving items that don't affect current song position
            newCurrentSongIndex = currentIndex;
            print('   - Rule 1: No change to current song index: $currentIndex');
          }
          
          // Update local current song index immediately for UI
          setState(() {
            _localCurrentSongIndex = newCurrentSongIndex;
          });
        }
      } else {
        // No actual reordering happened
        newCurrentSongIndex = _localCurrentSongIndex;
      }

      // Send reordered queue to server using setJamQueue
      final jamSessionId = widget.jamSession?.jamSessionId ?? '';
      if (jamSessionId.isNotEmpty) {
        try {
          print('🔄 SERVER REORDER: Sending queue to server (${_localQueue.length} songs)');
          
          final (serverQueue, serverRev, serverCurrentSong) = await _jamService.setJamQueue(
            jamSessionId,
            _localQueue,
            expectedRevision: _localRevision,
            currentSongIndex: newCurrentSongIndex,
          );
          
          if (serverQueue != null) {
            setState(() {
              _localQueue = _removeDuplicates(serverQueue);
              _localRevision = serverRev ?? _localRevision;
              _localCurrentSongIndex = serverCurrentSong ?? newCurrentSongIndex;
              _isReordering = false;
              _filterSongs(); // Refresh filtered indices
            });
            
            print('✅ SERVER REORDER SUCCESS: Queue updated (${_localQueue.length} songs)');
            
            // Notify parent with updated current song index
            widget.onQueueUpdated?.call(_localQueue, _localRevision);
            
            // If current song index changed, notify parent about the new current song
            if (serverCurrentSong != null && serverCurrentSong != widget.currentSongIndex) {
              print('🔄 NOTIFYING PARENT: Current song changed to $serverCurrentSong');
              widget.onCurrentSongChanged?.call(serverCurrentSong);
            }
          } else {
            print('❌ SERVER REORDER FAILED: setJamQueue returned null');
            _handleReorderError('Failed to reorder queue on server');
          }
        } catch (e) {
          print('❌ SERVER REORDER FAILED: Error reordering queue: $e');
          print('❌ Error type: ${e.runtimeType}');
          _handleReorderError('Error reordering queue: $e');
        }
      } else {
        print('❌ SERVER REORDER FAILED: No jam session ID');
        _handleReorderError('No jam session ID');
      }
      
      // Calculate next and previous song indices for debugging
      int? nextSongIndex;
      int? previousSongIndex;
      
      if (newCurrentSongIndex != null) {
        // Next song: song after current position in queue
        if (newCurrentSongIndex < _localQueue.length - 1) {
          nextSongIndex = _localQueue[newCurrentSongIndex + 1];
        }
        
        // Previous song: song before current position in queue
        if (newCurrentSongIndex > 0) {
          previousSongIndex = _localQueue[newCurrentSongIndex - 1];
        }
      }
      
      print('🔄 Reorder completed successfully');
      print('   - Next song: ${nextSongIndex != null ? "Song $nextSongIndex" : "None"}');
      print('   - Previous song: ${previousSongIndex != null ? "Song $previousSongIndex" : "None"}');
      
    } catch (e) {
      print('❌ Error reordering queue: $e');
      _handleReorderError('Failed to reorder queue: $e');
    } finally {
      // Ensure _isReordering is always reset, even if there was an error
      if (_isReordering) {
        setState(() {
          _isReordering = false;
        });
      }
    }
  }

  void _handleReorderError(String message) {
    setState(() {
      _isReordering = false;
      _errorMessage = message;
    });
  }

  List<int> _removeDuplicates(List<int> queue) {
    final seen = <int>{};
    final availableSongs = widget.jamSession?.setList?.songs?.length ?? 0;
    return queue.where((songIndex) => 
      seen.add(songIndex) && songIndex >= 0 && songIndex < availableSongs
    ).toList();
  }

  String _getSongTitle(int songIndex) {
    if (widget.jamSession?.setList?.songs?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songs!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.title;
      }
    }
    return 'Song $songIndex';
  }

  String _getSongArtist(int songIndex) {
    if (widget.jamSession?.setList?.songs?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songs!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.artist;
      }
    }
    return '';
  }

  String? _getAlbumCover(int songIndex) {
    if (widget.jamSession?.setList?.songs?.isNotEmpty == true) {
      final songs = widget.jamSession!.setList!.songs!;
      if (songIndex >= 0 && songIndex < songs.length) {
        return songs[songIndex].song.albumCover;
      }
    }
    return null;
  }

  Widget _buildAlbumArt(int songIndex, bool isSelected) {
    final albumCoverUrl = _getAlbumCover(songIndex);
    
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: isSelected 
              ? const Color(0xFF8B7ED8).withValues(alpha: 0.7)
              : Colors.white.withValues(alpha: 0.3),
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
                  color: isSelected 
                      ? const Color(0xFF8B7ED8).withValues(alpha: 0.7)
                      : const Color(0xFFF0F0F0).withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  color: isSelected 
                      ? const Color(0xFF8B7ED8).withValues(alpha: 0.7)
                      : const Color(0xFFF0F0F0).withValues(alpha: 0.3),
                  child: const Icon(
                    Icons.music_note,
                    color: Colors.white,
                    size: 12,
                  ),
                ),
              )
            : Container(
                color: isSelected 
                    ? const Color(0xFF8B7ED8).withValues(alpha: 0.7)
                    : const Color(0xFFF0F0F0).withValues(alpha: 0.3),
                child: const Icon(
                  Icons.music_note,
                  color: Colors.white,
                  size: 12,
                ),
              ),
      ),
    );
  }

  Widget _buildAlbumArtForSetlist(dynamic song, bool isSelected) {
    if (song.albumCover != null && song.albumCover!.isNotEmpty) {
      return Container(
        width: 50,
        height: 50,
        margin: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(4),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: CachedNetworkImage(
            imageUrl: song.albumCover!,
            fit: BoxFit.cover,
            placeholder: (context, url) => Container(
              color: Colors.grey[300],
              child: Icon(
                Icons.music_note,
                color: Colors.grey[600],
                size: 24,
              ),
            ),
            errorWidget: (context, url, error) => Container(
              color: Colors.grey[300],
              child: Icon(
                Icons.music_note,
                color: Colors.grey[600],
                size: 24,
              ),
            ),
          ),
        ),
      );
    }
    
    // Fallback: Show music note icon
    return Container(
      width: 50,
      height: 50,
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[300],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Icon(
        Icons.music_note,
        color: Colors.grey[600],
        size: 24,
      ),
    );
  }

  bool _shouldShowButtonText(double availableWidth) {
    // Show text if container width is at least 400px (enough for all three buttons with text)
    // This threshold can be adjusted based on testing
    return availableWidth >= 400;
  }

  Future<void> _removeFromQueue(int index) async {
    setState(() {
      _isReordering = true;
      _errorMessage = null;
    });

    // Convert filtered index to actual queue index
    if (index < 0 || index >= _filteredQueueIndices.length) {
      print('❌ Invalid filtered index: $index (length: ${_filteredQueueIndices.length})');
      setState(() {
        _isReordering = false;
        _errorMessage = 'Invalid song index';
      });
      return;
    }
    
    final queueIndex = _filteredQueueIndices[index];
    if (queueIndex < 0 || queueIndex >= _localQueue.length) {
      print('❌ Invalid queue index: $queueIndex (length: ${_localQueue.length})');
      setState(() {
        _isReordering = false;
        _errorMessage = 'Invalid song position';
      });
      return;
    }

    print('🗑️ Removing song at filtered index $index (queue index $queueIndex)');
    
    // Remove from local queue using the correct queue index
    _localQueue.removeAt(queueIndex);
    
    // Update filtered indices immediately to prevent UI errors
    _filterSongs();
    
    // Update UI immediately to reflect the change
    setState(() {
      _isReordering = false;
    });

    // Send to backend with OCC retry
    for (int attempt = 0; attempt < 3; attempt++) {
      try {
        final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
          widget.jamSession?.jamSessionId ?? '',
          _localQueue,
          expectedRevision: _localRevision,
        );

        if (serverQueue != null) {
          // Success - update with server state
          setState(() {
            _localQueue = _removeDuplicates(serverQueue);
            _localRevision = serverRev ?? _localRevision;
            _isReordering = false;
            _filterSongs(); // Refresh filtered indices after server update
          });
          
          // Notify parent
          widget.onQueueUpdated?.call(_localQueue, _localRevision);
          return;
        } else {
          // Retry - get current server state
          final (currentQueue, currentRev) = await _jamService.getJamQueue(widget.jamSession?.jamSessionId ?? '');
          if (currentQueue != null && currentRev != null) {
            setState(() {
              _localQueue = _removeDuplicates(currentQueue);
              _localRevision = currentRev;
              _filterSongs(); // Refresh filtered indices after retry
            });
          } else {
            break;
          }
        }
      } catch (e) {
        print('❌ Error removing from queue (attempt ${attempt + 1}): $e');
        if (attempt == 2) {
          // Don't show error message for index-related errors as they're handled gracefully
          if (!e.toString().contains('RangeError') && !e.toString().contains('index')) {
            setState(() {
              _errorMessage = 'Failed to remove from queue: $e';
              _isReordering = false;
            });
          } else {
            setState(() {
              _isReordering = false;
            });
          }
        }
      }
    }
  }

  Future<void> _cleanupQueue() async {
    if (_localQueue.length != _removeDuplicates(_localQueue).length) {
      print('🧹 Cleaning up duplicate songs in queue...');
      final cleanedQueue = _removeDuplicates(_localQueue);
      
      try {
        final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
          widget.jamSession?.jamSessionId ?? '',
          cleanedQueue,
          expectedRevision: _localRevision,
        );
        
        if (serverQueue != null) {
          setState(() {
            _localQueue = _removeDuplicates(serverQueue);
            _localRevision = serverRev ?? _localRevision;
          });
          
          widget.onQueueUpdated?.call(_localQueue, _localRevision);
          print('✅ Queue cleaned up successfully');
        }
      } catch (e) {
        print('❌ Failed to cleanup queue: $e');
      }
    }
  }

  Future<void> _removeDuplicatesFromQueue() async {
    setState(() {
      _isReordering = true;
      _errorMessage = null;
    });

    try {
      print('🧹 Removing duplicates from queue...');
      final cleanedQueue = _removeDuplicates(_localQueue);
      
      if (cleanedQueue.length == _localQueue.length) {
        print('✅ No duplicates found in queue');
        setState(() {
          _isReordering = false;
        });
        return;
      }
      
      print('🧹 Found ${_localQueue.length - cleanedQueue.length} duplicates, cleaning...');
      
      final jamSessionId = widget.jamSession?.jamSessionId ?? '';
      if (jamSessionId.isNotEmpty) {
        final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
          jamSessionId,
          cleanedQueue,
          expectedRevision: _localRevision,
        );
        
        if (serverQueue != null) {
          setState(() {
            _localQueue = _removeDuplicates(serverQueue);
            _localRevision = serverRev ?? _localRevision;
            _isReordering = false;
            _filterSongs(); // Refresh filtered indices
          });
          
          widget.onQueueUpdated?.call(_localQueue, _localRevision);
          print('✅ Duplicates removed successfully');
        } else {
          print('❌ Failed to remove duplicates on server');
          setState(() {
            _errorMessage = 'Failed to remove duplicates on server';
            _isReordering = false;
          });
        }
      } else {
        print('❌ No jam session ID');
        setState(() {
          _errorMessage = 'No jam session ID';
          _isReordering = false;
        });
      }
    } catch (e) {
      print('❌ Error removing duplicates: $e');
      setState(() {
        _errorMessage = 'Failed to remove duplicates: $e';
        _isReordering = false;
      });
    }
  }

  void _clearQueue() {
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Clear Queue'),
          content: const Text('Are you sure you want to clear the entire queue?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await _clearQueueCompletely();
              },
              style: TextButton.styleFrom(
                foregroundColor: Colors.red,
              ),
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }

  void _resetToSetlist() {
    // Show confirmation dialog
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Reset to Setlist'),
          content: const Text('Are you sure you want to reset the queue to the full setlist order?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                Navigator.of(context).pop();
                await _resetQueueToFullSetlist();
              },
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF3182CE),
              ),
              child: const Text('Reset'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _clearQueueCompletely() async {
    try {
      print('🗑️ Clearing queue completely');
      
      final jamSessionId = widget.jamSession?.jamSessionId;
      if (jamSessionId == null || jamSessionId.isEmpty) {
        print('❌ Cannot clear queue: jamSessionId is null or empty');
        setState(() {
          _errorMessage = 'Invalid jam session ID';
        });
        return;
      }
      
      // Clear the queue completely by removing all songs
      print('🗑️ Removing all songs from queue...');
      for (int i = _localQueue.length - 1; i >= 0; i--) {
        try {
          await _jamService.removeSongFromJamQueue(jamSessionId, i);
          print('🗑️ Removed song at index $i');
        } catch (e) {
          print('❌ Error removing song at index $i: $e');
        }
      }
      
      // Update local state
      setState(() {
        _localQueue = <int>[];
      });
      
      // Get the final queue state from server
      try {
        final (serverQueue, serverRev) = await _jamService.getJamQueue(jamSessionId);
        if (serverQueue != null) {
          setState(() {
            _localQueue = _removeDuplicates(serverQueue);
            _localRevision = serverRev ?? _localRevision;
          });
          print('✅ Queue cleared successfully');
          
          // Notify parent
          widget.onQueueUpdated?.call(_localQueue, _localRevision);
        } else {
          print('❌ Failed to get final queue state from server');
          setState(() {
            _errorMessage = 'Failed to get final queue state from server';
          });
        }
      } catch (e) {
        print('❌ Error getting final queue state: $e');
        setState(() {
          _errorMessage = 'Error getting final queue state: $e';
        });
      }
    } catch (e) {
      print('❌ Error clearing queue: $e');
      setState(() {
        _errorMessage = 'Failed to clear queue: $e';
      });
    }
  }

  Future<void> _addSongToQueue(int songIndex) async {
    try {
      print('➕ Adding song $songIndex to queue');
      
      // Add song to the end of the queue
      final newQueue = List<int>.from(_localQueue)..add(songIndex);
      
      // Update local state
      setState(() {
        _localQueue = newQueue;
        _localRevision++;
      });
      
      // Notify parent
      widget.onQueueUpdated?.call(_localQueue, _localRevision);
      
      print('✅ Song added to queue successfully');
    } catch (e) {
      print('❌ Error adding song to queue: $e');
      setState(() {
        _errorMessage = 'Failed to add song to queue: $e';
      });
    }
  }

  Future<void> _resetQueueToFullSetlist() async {
    try {
      print('🗑️ Resetting queue to full setlist');
      
      // Show loading state
      setState(() {
        _isResetting = true;
        _errorMessage = null;
      });
      
      // Reset to full setlist order
      if (widget.jamSession?.setList?.songs?.isNotEmpty == true) {
        final jamSessionId = widget.jamSession?.jamSessionId;
        if (jamSessionId == null || jamSessionId.isEmpty) {
          print('❌ Cannot reset queue: jamSessionId is null or empty');
          setState(() {
            _errorMessage = 'Invalid jam session ID';
            _isResetting = false;
          });
          return;
        }
        
        final fullQueue = this.fullQueue;
        
        print('🎵 Resetting queue to full setlist with ${fullQueue.length} songs');
        print('🎵 Jam Session ID: $jamSessionId');
        print('🎵 Current revision: $_localRevision');
        
        // Replace entire queue at once using setJamQueue (much faster!)
        print('🔄 FAST METHOD: Attempting to replace entire queue with setlist...');
        print('🔄 Full queue to set: $fullQueue');
        print('🔄 Expected revision: $_localRevision');
        try {
          final (serverQueue, serverRev, _) = await _jamService.setJamQueue(
            jamSessionId,
            fullQueue,
            expectedRevision: _localRevision,
          );
          
          if (serverQueue != null) {
            setState(() {
              _localQueue = _removeDuplicates(serverQueue);
              _localRevision = serverRev ?? _localRevision;
            });
            print('✅ FAST METHOD SUCCESS: Queue replaced with setlist successfully');
            print('✅ Final queue: $_localQueue');
            print('✅ Queue length: ${_localQueue.length}');
            
            // Notify parent
            widget.onQueueUpdated?.call(_localQueue, _localRevision);
            return; // Exit early on success
          } else {
            print('❌ FAST METHOD FAILED: setJamQueue returned null - falling back to slow method');
          }
        } catch (e) {
          print('❌ FAST METHOD FAILED: Error replacing queue with setlist: $e');
          print('❌ Error type: ${e.runtimeType}');
          print('❌ This likely means setJamQueue mutation is not deployed on the server');
          // Fall back to old method if setJamQueue fails
        }
        
        // Fallback: Clear existing queue first by removing all songs
        print('🗑️ FALLBACK METHOD: Clearing existing queue (slow method)...');
        print('🗑️ Current queue length: ${_localQueue.length}');
        for (int i = _localQueue.length - 1; i >= 0; i--) {
          try {
            await _jamService.removeSongFromJamQueue(jamSessionId, i);
            print('🗑️ Removed song at index $i');
          } catch (e) {
            print('❌ Error removing song at index $i: $e');
          }
        }
        
        // Add all songs from setlist to queue
        print('➕ FALLBACK METHOD: Adding songs from setlist to queue (slow method)...');
        for (int i = 0; i < fullQueue.length; i++) {
          try {
            await _jamService.addSongToJamQueue(jamSessionId, fullQueue[i]);
            print('➕ Added song ${fullQueue[i]} to queue');
          } catch (e) {
            print('❌ Error adding song ${fullQueue[i]} to queue: $e');
          }
        }
        
        // Update local state
        setState(() {
          _localQueue = fullQueue;
        });
        
        // Get the final queue state from server
        try {
          final (serverQueue, serverRev) = await _jamService.getJamQueue(jamSessionId);
          if (serverQueue != null) {
            setState(() {
              _localQueue = _removeDuplicates(serverQueue);
              _localRevision = serverRev ?? _localRevision;
            });
            print('✅ Queue reset to full setlist successfully (FALLBACK METHOD)');
            print('✅ Final queue: $_localQueue');
            print('✅ Queue length: ${_localQueue.length}');
            
            // Notify parent
            widget.onQueueUpdated?.call(_localQueue, _localRevision);
          } else {
            print('❌ Failed to get final queue state from server');
            setState(() {
              _errorMessage = 'Failed to get final queue state from server';
            });
          }
        } catch (e) {
          print('❌ Error getting final queue state: $e');
          setState(() {
            _errorMessage = 'Error getting final queue state: $e';
          });
        }
      } else {
        print('❌ Cannot reset queue: no setlist available');
        setState(() {
          _errorMessage = 'No setlist available to reset to';
        });
      }
    } catch (e) {
      print('❌ Error resetting queue: $e');
      setState(() {
        _errorMessage = 'Error resetting queue: $e';
      });
    } finally {
      // Clear loading state
      setState(() {
        _isResetting = false;
      });
    }
  }


  Widget _buildQueueManagementContent(ScrollController scrollController) {
    // Only clean up duplicates if there are actually duplicates
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_localQueue.length != _removeDuplicates(_localQueue).length) {
        _cleanupQueue();
      }
    });
    
    if (widget.jamSession?.setList?.songs?.isNotEmpty != true) {
      return Center(
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
              'No songs available',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Add songs to the set list first',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.transparent,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Action buttons container
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final availableWidth = constraints.maxWidth;
                final showText = _shouldShowButtonText(availableWidth);
                
                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                // Reset to setlist button
                Expanded(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _isResetting ? null : _resetToSetlist,
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        decoration: BoxDecoration(
                          color: _isResetting 
                              ? Colors.white.withValues(alpha: 0.05)
                              : Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: _isResetting 
                                ? Colors.white.withValues(alpha: 0.2)
                                : Colors.white.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (_isResetting) ...[
                              SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.grey[600]!,
                                  ),
                                ),
                              ),
                              if (showText) ...[
                                const SizedBox(width: 6),
                                Text(
                                  'Resetting...',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ] else ...[
                              Icon(
                                Icons.restore,
                                color: Colors.white,
                                size: 16,
                              ),
                              if (showText) ...[
                                const SizedBox(width: 6),
                                const Text(
                                  'Reset to Setlist',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Clear queue button
                Expanded(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _clearQueue,
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.clear_all,
                              color: Colors.white,
                              size: 16,
                            ),
                            if (showText) ...[
                              const SizedBox(width: 6),
                              const Text(
                                'Clear Queue',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Remove duplicates button
                Expanded(
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _removeDuplicatesFromQueue,
                      borderRadius: BorderRadius.circular(6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.3),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.cleaning_services,
                              color: Colors.white,
                              size: 16,
                            ),
                            if (showText) ...[
                              const SizedBox(width: 6),
                              const Text(
                                'Remove Duplicates',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                  ],
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          
          // Search bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.2),
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
                onChanged: (value) {
                  setState(() {
                    _searchQuery = value;
                    _filterSongs();
                  });
                },
                decoration: InputDecoration(
                  hintText: 'Search all songs...',
                  hintStyle: TextStyle(
                    color: Colors.white.withValues(alpha: 0.7),
                    fontSize: 14,
                  ),
                  prefixIcon: Icon(
                    Icons.search,
                    color: Colors.white.withValues(alpha: 0.7),
                    size: 18,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            Icons.clear,
                            color: Colors.white.withValues(alpha: 0.7),
                            size: 16,
                          ),
                          onPressed: () {
                            setState(() {
                              _searchQuery = '';
                              _searchController.clear();
                              _filterSongs();
                            });
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
                ),
              ),
            ),
          ),

          
          const SizedBox(height: 8),
          Expanded(
            child: _buildReorderableQueue(),
          ),
        ],
      ),
    );
  }

  Widget _buildSetlistContent() {
    if (widget.jamSession?.setList?.songs?.isEmpty != false) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.music_note_outlined,
                size: 48,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'No setlist available',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Add songs to the setlist first',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final songs = widget.jamSession!.setList!.songs!;
    
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: songs.length,
      itemBuilder: (context, index) {
        final song = songs[index].song;
        final isSelected = _localCurrentSongIndex == index;
        
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                widget.onSongSelected?.call(index);
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected 
                      ? const Color(0xFFD4C5E8).withValues(alpha: 0.3)
                      : Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isSelected 
                        ? const Color(0xFF8B7ED8).withValues(alpha: 0.5)
                        : const Color(0xFFE0E0E0).withValues(alpha: 0.3),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Album art
                    _buildAlbumArtForSetlist(song, isSelected),
                    const SizedBox(width: 12),
                    
                    // Song info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            song.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (song.artist.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              song.artist,
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.8),
                                fontSize: 12,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                    
                    // Add to queue button
                    IconButton(
                      onPressed: () {
                        _addSongToQueue(index);
                      },
                      icon: Icon(
                        Icons.add_circle_outline,
                        color: const Color(0xFF8B7ED8),
                        size: 20,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildReorderableQueue() {
    if (_localQueue.isEmpty) {
      return Center(
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.queue_music_outlined,
                size: 48,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'No songs in queue',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Add songs to the queue to start playing',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
              ),
              const SizedBox(height: 24),
              // Add Songs button with liquid glass design
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF8B7ED8).withValues(alpha: 0.8),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF8B7ED8).withValues(alpha: 0.3),
                    width: 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      // Switch to setlist tab to add songs
                      _tabController.animateTo(1);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.add,
                            color: Colors.white,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Add Songs',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: [
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
            itemCount: _filteredQueueIndices.length,
            onReorder: _reorderQueue,
            buildDefaultDragHandles: false,
            itemBuilder: (context, index) {
              // Bounds checking to prevent RangeError
              if (index < 0 || index >= _filteredQueueIndices.length) {
                print('❌ Invalid filtered index in itemBuilder: $index (length: ${_filteredQueueIndices.length})');
                return const SizedBox.shrink();
              }
              
              final queueIndex = _filteredQueueIndices[index];
              if (queueIndex < 0 || queueIndex >= _localQueue.length) {
                print('❌ Invalid queue index in itemBuilder: $queueIndex (length: ${_localQueue.length})');
                return const SizedBox.shrink();
              }
              
              final songIndex = _localQueue[queueIndex];
              
              // Safe song info retrieval with error handling
              String title;
              String artist;
              try {
                title = _getSongTitle(songIndex);
                artist = _getSongArtist(songIndex);
              } catch (e) {
                print('❌ Error getting song info for index $songIndex: $e');
                title = 'Unknown Song';
                artist = '';
              }
              
              // Check if this position in the queue is the current song position
              final isSelected = queueIndex == _localCurrentSongIndex;
              

              return ReorderableDragStartListener(
                key: ValueKey('queue_${songIndex}_$index'),
                index: index,
                child: GestureDetector(
                  onPanStart: (details) {
                    print('🎯 TAB SELECTED: Starting drag of song at position $index');
                    print('   - Song Index: $songIndex');
                    print('   - Song Title: $title');
                    print('   - Queue Index: $queueIndex');
                    print('   - Current Song Index: ${widget.currentSongIndex}');
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () {
                          widget.onSongSelected?.call(queueIndex);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected 
                                ? const Color(0xFFD4C5E8).withValues(alpha: 0.3)
                                : Colors.white.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected 
                                  ? const Color(0xFF8B7ED8).withValues(alpha: 0.5)
                                  : const Color(0xFFE0E0E0).withValues(alpha: 0.3),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              // Album art (replacing song number)
                              _buildAlbumArt(songIndex, isSelected),
                              const SizedBox(width: 12),

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
                                          color: Colors.white.withValues(alpha: 0.8),
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
                                      ? Colors.white.withValues(alpha: 0.5)
                                      : Colors.white,
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
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // Only clean up duplicates when queue actually changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_localQueue.length != _removeDuplicates(_localQueue).length) {
        _cleanupQueue();
      }
    });
    
    return Container(
      decoration: const BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
      child: Column(
        children: [
          // Title and close button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                const Icon(
                  Icons.queue_music,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Queue',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Apple liquid glass style tabs
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.2),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.3),
                  width: 1,
                ),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              labelColor: Colors.white,
              unselectedLabelColor: Colors.white.withValues(alpha: 0.7),
              labelStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              tabs: const [
                Tab(text: 'Queue'),
                Tab(text: 'Setlist'),
              ],
            ),
          ),
          
          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Queue tab
                _buildQueueManagementContent(_scrollController),
                // Setlist tab
                _buildSetlistContent(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
