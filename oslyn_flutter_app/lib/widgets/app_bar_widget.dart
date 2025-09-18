import 'package:flutter/material.dart';
import 'key_selector_widget.dart';
import 'capo_selector_widget.dart';
import 'user_account_widget.dart';
import '../utils/font_utils.dart';

class AppBarWidget extends StatelessWidget {
  final String? songTitle;
  final String? artistName;
  final String? albumName;
  final String? albumCover;
  final String? currentKey;
  final String? originalKey;
  final int capo;
  final bool showLeftNavigationSidebar;
  final bool showSidebar;
  final VoidCallback? onMenuPressed;
  final VoidCallback? onSidebarPressed;
  final VoidCallback? onSettingsPressed;
  final Function(String)? onKeyChanged;
  final Function(String, bool)? onKeyChangedWithSync;
  final ValueChanged<int>? onCapoChanged;
  final bool isSyncingKey;
  final VoidCallback? onUserAccountPressed;
  final double? leftContainerWidthRatio;

  const AppBarWidget({
    Key? key,
    this.songTitle,
    this.artistName,
    this.albumName,
    this.albumCover,
    this.currentKey,
    this.originalKey,
    this.capo = 0,
    this.showLeftNavigationSidebar = false,
    this.showSidebar = false,
    this.onMenuPressed,
    this.onSidebarPressed,
    this.onSettingsPressed,
    this.onKeyChanged,
    this.onKeyChangedWithSync,
    this.onCapoChanged,
    this.isSyncingKey = false,
    this.onUserAccountPressed,
    this.leftContainerWidthRatio,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.transparent, // Transparent background
        // No shadow for clean transparent look
      ),
      child: Row(
        children: [
          // Menu Button
          _buildMenuButton(),
          const SizedBox(width: 8),
          
          // Album Art
          _buildAlbumArt(),
          const SizedBox(width: 12),
          
          // Song Information
          Expanded(
            child: _buildSongInfo(),
          ),
          
          // Control Buttons
          _buildControlButtons(),
        ],
      ),
    );
  }

  Widget _buildMenuButton() {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IconButton(
        onPressed: onMenuPressed,
        icon: Icon(
          showLeftNavigationSidebar ? Icons.menu : Icons.menu_outlined,
          color: Colors.black87,
        ),
        tooltip: 'Toggle Navigation Menu',
      ),
    );
  }

  Widget _buildAlbumArt() {
    // Calculate responsive size based on left container width ratio
    // When left container is larger (higher ratio), make album art larger
    // Range: 0.143 (1/7) to 0.5 (1/2), map to size range 40-80
    final baseSize = 40.0;
    final maxSize = 80.0;
    final ratio = leftContainerWidthRatio ?? 0.33; // Default to 1/3 if not provided
    final normalizedRatio = (ratio - 1.0/7.0) / (0.5 - 1.0/7.0); // Normalize to 0-1
    final size = baseSize + (maxSize - baseSize) * normalizedRatio;
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: albumCover != null && albumCover!.isNotEmpty
            ? Image.network(
                albumCover!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => _buildPlaceholderAlbumArt(size),
              )
            : _buildPlaceholderAlbumArt(size),
      ),
    );
  }

  Widget _buildPlaceholderAlbumArt(double size) {
    return Container(
      color: Colors.grey[300],
      child: Icon(
        Icons.music_note,
        color: Colors.grey,
        size: size * 0.5, // Icon size is half of container size
      ),
    );
  }

  Widget _buildSongInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Song Title
        Text(
          songTitle ?? 'Unknown Song',
          style: FontUtils.sfPro(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
            isDisplay: true,
          ).copyWith(
            shadows: [
              Shadow(
                color: Colors.black26,
                offset: Offset(0, 1),
                blurRadius: 2,
              ),
            ],
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        
        // Artist Name
        Text(
          artistName ?? 'Unknown Artist',
          style: FontUtils.sfPro(
            fontSize: 14,
            color: Color(0xFF666666),
            fontWeight: FontWeight.w500,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        
        // Album Name
        Text(
          albumName ?? 'Unknown Album',
          style: FontUtils.sfPro(
            fontSize: 12,
            color: Color(0xFF666666),
          ).copyWith(fontStyle: FontStyle.italic),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildControlButtons() {
    return Row(
      children: [
        // Key Selector
        Container(
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: KeySelectorWidget(
            currentKey: currentKey ?? originalKey ?? 'C',
            originalKey: originalKey ?? 'C',
            onKeyChanged: isSyncingKey ? null : onKeyChanged,
            onKeyChangedWithSync: isSyncingKey ? null : onKeyChangedWithSync,
          ),
        ),

        // Capo Selector
        Container(
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: CapoSelectorWidget(
            capo: capo,
            onCapoChanged: onCapoChanged ?? (value) {},
          ),
        ),
        
        // Sidebar Toggle Button
        Container(
          width: 48,
          height: 48,
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: IconButton(
            onPressed: onSidebarPressed,
            icon: Icon(
              showSidebar ? Icons.view_list : Icons.view_list_outlined,
              color: Colors.black87,
            ),
            tooltip: 'Toggle Section Sidebar',
          ),
        ),
        
        // Settings Button
        Container(
          width: 48,
          height: 48,
          margin: const EdgeInsets.only(right: 8),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: IconButton(
            onPressed: onSettingsPressed,
            icon: const Icon(
              Icons.settings,
              color: Colors.black87,
            ),
            tooltip: 'Settings',
          ),
        ),
        
        // User Account Button
        UserAccountWidget(
          onTap: onUserAccountPressed,
          size: 48,
        ),
      ],
    );
  }
}
