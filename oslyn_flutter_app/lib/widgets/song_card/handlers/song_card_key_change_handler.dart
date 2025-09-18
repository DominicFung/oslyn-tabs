import 'package:flutter/material.dart';
import '../../../services/jam_service.dart';
import '../../../models/jam_session.dart';
import '../utils/song_card_utils.dart';

class SongCardKeyChangeHandler {
  final String jamSessionId;
  final JamService jamService;
  final VoidCallback setState;
  final FocusNode focusNode;
  
  // State getters and setters
  final String Function() getCurrentKey;
  final void Function(String) setCurrentKey;
  final bool Function() getIsSyncingKey;
  final void Function(bool) setIsSyncingKey;
  final String? Function() getSyncError;
  final void Function(String?) setSyncError;
  final int Function() getCurrentPage;
  final void Function(int) setCurrentPage;
  final bool Function() getIsFirstPage;
  final void Function(bool) setIsFirstPage;
  final bool Function() getIsLastPage;
  final void Function(bool) setIsLastPage;
  final int Function() getCurrentSongIndex;
  final dynamic Function() getJamSession;
  final List<Song>? Function() getSongs;
  final List<int> Function() getQueue;

  SongCardKeyChangeHandler({
    required this.jamSessionId,
    required this.jamService,
    required this.setState,
    required this.focusNode,
    required this.getCurrentKey,
    required this.setCurrentKey,
    required this.getIsSyncingKey,
    required this.setIsSyncingKey,
    required this.getSyncError,
    required this.setSyncError,
    required this.getCurrentPage,
    required this.setCurrentPage,
    required this.getIsFirstPage,
    required this.setIsFirstPage,
    required this.getIsLastPage,
    required this.setIsLastPage,
    required this.getCurrentSongIndex,
    required this.getJamSession,
    required this.getSongs,
    required this.getQueue,
  });

  Future<void> onKeyChanged(String newKey) async {
    // This method is kept for backward compatibility but now calls the sync version
    await onKeyChangedWithSync(newKey, true);
  }

  Future<void> onKeyChangedWithSync(String newKey, bool syncWithAllUsers) async {
    if (newKey != getCurrentKey() && !getIsSyncingKey()) {
      // Show loading state
      setState();
      setIsSyncingKey(true);
      setSyncError(null);
      
      try {
        if (syncWithAllUsers) {
          // Wait for backend confirmation
          await jamService.setSongKey(jamSessionId, newKey, song: getCurrentSongIndex());
          print('✅ Key change synchronized with backend');
        } else {
          // Local change only - no backend sync
          print('🎵 Key changed locally only');
        }
        
        // Update UI after successful sync (or immediately for local changes)
        setState();
        setCurrentKey(newKey);
        // Reset to first page when key changes to show the effect
        setCurrentPage(0);
        setIsFirstPage(true);
        final totalPages = SongCardUtils.getTotalPages(getJamSession());
        setIsLastPage(totalPages != null && totalPages <= 1);
        setIsSyncingKey(false);
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState();
        setIsSyncingKey(false);
        setSyncError('Failed to sync key change: $e');
        print('❌ Failed to sync key change: $e');
      }
    }
  }
}
