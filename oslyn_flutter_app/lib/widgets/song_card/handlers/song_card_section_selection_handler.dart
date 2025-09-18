import 'package:flutter/material.dart';
import '../../../services/jam_service.dart';
import '../../../models/jam_session.dart';
import '../utils/song_card_utils.dart';

class SongCardSectionSelectionHandler {
  final String jamSessionId;
  final JamService jamService;
  final VoidCallback setState;
  final FocusNode focusNode;
  
  // State getters and setters
  final int Function() getCurrentPage;
  final void Function(int) setCurrentPage;
  final bool Function() getIsSyncingPage;
  final void Function(bool) setIsSyncingPage;
  final String? Function() getSyncError;
  final void Function(String?) setSyncError;
  final bool Function() getIsLastPage;
  final void Function(bool) setIsLastPage;
  final bool Function() getIsFirstPage;
  final void Function(bool) setIsFirstPage;
  final int Function() getCurrentSongIndex;
  final dynamic Function() getJamSession;
  final List<Song>? Function() getSongs;
  final List<int> Function() getQueue;

  SongCardSectionSelectionHandler({
    required this.jamSessionId,
    required this.jamService,
    required this.setState,
    required this.focusNode,
    required this.getCurrentPage,
    required this.setCurrentPage,
    required this.getIsSyncingPage,
    required this.setIsSyncingPage,
    required this.getSyncError,
    required this.setSyncError,
    required this.getIsLastPage,
    required this.setIsLastPage,
    required this.getIsFirstPage,
    required this.setIsFirstPage,
    required this.getCurrentSongIndex,
    required this.getJamSession,
    required this.getSongs,
    required this.getQueue,
  });

  Future<void> onSectionSelected(int pageIndex) async {
    if (pageIndex != getCurrentPage() && !getIsSyncingPage()) {
      // Show loading state
      setState();
      setIsSyncingPage(true);
      setSyncError(null);
      
      try {
        // Wait for backend confirmation
        await jamService.nextPage(jamSessionId, pageIndex);
        
        // Only update UI after successful backend sync
        setState();
        setCurrentPage(pageIndex);
        // Update last page status
        final totalPages = SongCardUtils.getTotalPages(getJamSession());
        setIsLastPage(totalPages != null && getCurrentPage() >= totalPages - 1);
        setIsFirstPage(getCurrentPage() == 0); // Check if we're on the first page
        setIsSyncingPage(false);
        
        print('✅ Section selection synchronized with backend');
        
        // Ensure focus is maintained after state update
        WidgetsBinding.instance.addPostFrameCallback((_) {
          focusNode.requestFocus();
        });
      } catch (e) {
        // Show error, don't update UI
        setState();
        setIsSyncingPage(false);
        setSyncError('Failed to sync section selection: $e');
        print('❌ Failed to sync section selection: $e');
      }
    }
  }
}
