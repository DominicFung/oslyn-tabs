import 'package:flutter/material.dart';
import '../../../services/jam_service.dart';

class SongCardSongSelectionHandler {
  final String jamSessionId;
  final JamService jamService;
  final VoidCallback setState;
  final FocusNode focusNode;
  
  // State getters and setters
  final int Function() getCurrentSongIndex;
  final void Function(int) setCurrentSongIndex;
  final bool Function() getIsSyncingSong;
  final void Function(bool) setIsSyncingSong;
  final String? Function() getSyncError;
  final void Function(String?) setSyncError;
  final int Function() getCurrentPage;
  final void Function(int) setCurrentPage;
  final bool Function() getIsFirstPage;
  final void Function(bool) setIsFirstPage;
  final bool Function() getIsLastPage;
  final void Function(bool) setIsLastPage;
  final List<int> Function() getQueue;
  final VoidCallback initializeCurrentKey;

  SongCardSongSelectionHandler({
    required this.jamSessionId,
    required this.jamService,
    required this.setState,
    required this.focusNode,
    required this.getCurrentSongIndex,
    required this.setCurrentSongIndex,
    required this.getIsSyncingSong,
    required this.setIsSyncingSong,
    required this.getSyncError,
    required this.setSyncError,
    required this.getCurrentPage,
    required this.setCurrentPage,
    required this.getIsFirstPage,
    required this.setIsFirstPage,
    required this.getIsLastPage,
    required this.setIsLastPage,
    required this.getQueue,
    required this.initializeCurrentKey,
  });

  Future<void> onSongSelected(int queuePosition) async {
    if (queuePosition != getCurrentSongIndex() && !getIsSyncingSong()) {
      // Show loading state
      setState();
      setIsSyncingSong(true);
      setSyncError(null);
      
      try {
        // Get the setlist index from the queue position
        if (queuePosition >= 0 && queuePosition < getQueue().length) {
          final setlistIndex = getQueue()[queuePosition];
          print('🎵 Song selected: queue position $queuePosition -> setlist index $setlistIndex');
          
          // Wait for backend confirmation with the setlist index
          await jamService.nextSong(jamSessionId, setlistIndex, page: 0);
          
          // Only update UI after successful backend sync
          setState();
          setCurrentSongIndex(queuePosition); // Store queue position, not setlist index
          setCurrentPage(0);
          setIsFirstPage(true);
          setIsLastPage(false);
          setIsSyncingSong(false);
          
          // Update current key for the new song
          initializeCurrentKey();
          
          print('✅ Song change synchronized with backend');
          print('🎵 Current song index (queue position): ${getCurrentSongIndex()}');
          print('🎵 Setlist index: $setlistIndex');
        } else {
          print('❌ Invalid queue position: $queuePosition (queue length: ${getQueue().length})');
          setState();
          setIsSyncingSong(false);
          setSyncError('Invalid song selection');
          return;
        }
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState();
        setIsSyncingSong(false);
        setSyncError('Failed to sync song change: $e');
        print('❌ Failed to sync song change: $e');
      }
    }
  }
}
