import 'package:flutter/material.dart';
import 'dart:ui';
import '../states/song_card_loading_states.dart';

class SongCardMainLayout extends StatelessWidget {
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback onRetry;
  final Widget body;
  final Widget header;
  final double topPadding;
  final bool disableTopBar;
  final bool isTopBarVisible;
  final bool showTopBarIndicator;
  final Animation<double> topBarSlideAnimation;
  final VoidCallback onSlideUpTopBar;
  final VoidCallback onSlideDownTopBar;
  final bool isSyncingPage;
  final bool isSyncingSong;
  final bool isSyncingKey;
  final String? syncError;
  final VoidCallback onDismissSyncError;
  final bool isSlidesInCompactMode;
  final Widget? sectionAndPageTurner;
  final List<Widget> additionalOverlays;

  const SongCardMainLayout({
    Key? key,
    required this.isLoading,
    this.errorMessage,
    required this.onRetry,
    required this.body,
    required this.header,
    required this.topPadding,
    required this.disableTopBar,
    required this.isTopBarVisible,
    required this.showTopBarIndicator,
    required this.topBarSlideAnimation,
    required this.onSlideUpTopBar,
    required this.onSlideDownTopBar,
    required this.isSyncingPage,
    required this.isSyncingSong,
    required this.isSyncingKey,
    this.syncError,
    required this.onDismissSyncError,
    required this.isSlidesInCompactMode,
    this.sectionAndPageTurner,
    this.additionalOverlays = const [],
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return SongCardLoadingStates.buildLoadingState();
    }

    if (errorMessage != null) {
      return SongCardLoadingStates.buildErrorState(
        errorMessage: errorMessage!,
        onRetry: onRetry,
      );
    }

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFFE0B9BE),
            Color(0xFFC7A2DB),
            Color(0xFFBD9DFA),
          ],
          stops: [0.0, 0.55, 1.0],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: _buildBodyWithSidebar(),
      ),
    );
  }

  Widget _buildBodyWithSidebar() {
    // Create the main content area - lyrics always use full screen
    Widget mainContent = Stack(
      children: [
        // Body content - add padding when top bar or guest banner is visible
        Positioned(
          top: topPadding,
          left: 0,
          right: 0,
          bottom: 0,
          child: body,
        ),
        
        // Top bar as positioned overlay (like a sidebar but at the top)
        if (!disableTopBar)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: AnimatedBuilder(
              animation: topBarSlideAnimation,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, topBarSlideAnimation.value * 100),
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      // Detect swipe up on the header (more sensitive)
                      if (details.delta.dy < -5) {
                        onSlideUpTopBar();
                      }
                    },
                    child: header,
                  ),
                );
              },
            ),
          ),
        
        // Swipe detector at the top of the screen (always present when top bar is hidden)
        // Placed after body to ensure it's on top and can capture gestures
        if (!disableTopBar && !isTopBarVisible)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 100, // Larger swipe detection area to account for moved content
            child: GestureDetector(
              onTap: () {
                print('Swipe detector: Tap detected, bringing back top bar');
                onSlideDownTopBar();
              },
              onPanStart: (details) {
                print('Swipe detector: Pan started at ${details.localPosition}');
              },
              onPanUpdate: (details) {
                print('Swipe detector: Pan update delta ${details.delta.dy}');
                // Detect swipe down at the top of the screen (more sensitive)
                if (details.delta.dy > 3) {
                  print('Swipe detector: Swipe down detected, bringing back top bar');
                  onSlideDownTopBar();
                }
              },
              onPanEnd: (details) {
                print('Swipe detector: Pan ended');
              },
              child: Container(
                color: Colors.transparent,
                child: showTopBarIndicator ? _buildTopBarIndicator() : _buildSimpleTopBarIndicator(),
              ),
            ),
          ),
        
        // Loading indicator (bottom left corner)
        if (isSyncingPage || isSyncingSong || isSyncingKey)
          Positioned(
            bottom: 16,
            left: 16,
            child: _buildSyncIndicator(),
          ),
        
        // Section label and page turner overlay (when in compact mode)
        if (isSlidesInCompactMode && sectionAndPageTurner != null)
          Positioned(
            bottom: 16,
            left: 16,
            child: sectionAndPageTurner!,
          ),
        
        // Error message overlay
        if (syncError != null)
          Positioned(
            top: 100,
            left: 16,
            right: 16,
            child: _buildSyncErrorOverlay(),
          ),
        
        // Additional overlays
        ...additionalOverlays,
      ],
    );

    return mainContent;
  }

  Widget _buildTopBarIndicator() {
    return Positioned(
      top: 8,
      left: 0,
      right: 0,
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.keyboard_arrow_down,
                color: Colors.white,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                'Tap or swipe down to show controls',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSimpleTopBarIndicator() {
    return Positioned(
      top: 8,
      left: 0,
      right: 0,
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            'Tap here to show controls',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSyncIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.2), width: 1.5),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                isSyncingPage 
                    ? 'Syncing page...' 
                    : isSyncingSong 
                        ? 'Syncing song...'
                        : 'Syncing key...',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  fontFamily: '.SF Pro Text',
                  fontFamilyFallback: ['SF Pro Text', 'system-ui', 'Roboto'],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSyncErrorOverlay() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade700),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              syncError!,
              style: TextStyle(color: Colors.red.shade700),
            ),
          ),
          IconButton(
            onPressed: onDismissSyncError,
            icon: Icon(Icons.close, color: Colors.red.shade700),
          ),
        ],
      ),
    );
  }
}
