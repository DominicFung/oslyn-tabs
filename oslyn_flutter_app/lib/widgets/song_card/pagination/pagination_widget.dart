import 'package:flutter/material.dart';

class PaginationWidget extends StatelessWidget {
  final int currentPage;
  final bool isLastPage;
  final bool isFirstPage;
  final bool isSyncingPage;
  final bool showUI;
  final bool isSlidesInCompactMode;
  final bool shouldShowSimplifiedSongInfo;
  final String currentSection;
  final int? totalPages;
  final VoidCallback? onPreviousPage;
  final VoidCallback? onNextPage;

  const PaginationWidget({
    super.key,
    required this.currentPage,
    required this.isLastPage,
    required this.isFirstPage,
    required this.isSyncingPage,
    required this.showUI,
    required this.isSlidesInCompactMode,
    required this.shouldShowSimplifiedSongInfo,
    required this.currentSection,
    this.totalPages,
    this.onPreviousPage,
    this.onNextPage,
  });

  @override
  Widget build(BuildContext context) {
    // Hide external pagination when slides widget is in compact mode
    // (it has its own built-in pagination)
    if (isSlidesInCompactMode) {
      return const SizedBox.shrink(); // Hide external pagination
    }
    
    // Use existing logic for normal mode
    if (shouldShowSimplifiedSongInfo) {
      return _buildCompactPagination();
    } else {
      return _buildFullPagination();
    }
  }


  Widget _buildCompactPagination() {
    return AnimatedOpacity(
      opacity: showUI ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: Container(
        margin: const EdgeInsets.only(left: 16, bottom: 16),
        child: Align(
          alignment: Alignment.bottomLeft,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: (currentPage > 0 && !isSyncingPage) ? onPreviousPage : null,
                  icon: Icon(
                    Icons.arrow_back_ios,
                    color: (currentPage > 0 && !isSyncingPage) ? Colors.white : Colors.white.withValues(alpha: 0.3),
                    size: 16,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
                Text(
                  '${currentPage + 1}${totalPages != null ? ' / $totalPages' : ''}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  onPressed: (isLastPage || isSyncingPage) ? null : onNextPage,
                  icon: Icon(
                    Icons.arrow_forward_ios,
                    color: (isLastPage || isSyncingPage) ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                    size: 16,
                  ),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFullPagination() {
    return AnimatedOpacity(
      opacity: showUI ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(25),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  onPressed: (currentPage > 0 && !isSyncingPage) ? onPreviousPage : null,
                  icon: Icon(
                    Icons.arrow_back_ios,
                    color: (currentPage > 0 && !isSyncingPage) ? Colors.white : Colors.white.withValues(alpha: 0.3),
                    size: 20,
                  ),
                ),
                Text(
                  '${currentPage + 1}${totalPages != null ? ' / $totalPages' : ''}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  onPressed: (isLastPage || isSyncingPage) ? null : onNextPage,
                  icon: Icon(
                    Icons.arrow_forward_ios,
                    color: (isLastPage || isSyncingPage) ? Colors.white.withValues(alpha: 0.3) : Colors.white,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
