import 'dart:ui';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import 'user_account_widget.dart';

class LeftNavigationSidebar extends StatelessWidget {
  final bool isVisible;
  final VoidCallback? onMySongs;
  final VoidCallback? onMyJamSessions;
  final VoidCallback? onUserAccountPressed;

  const LeftNavigationSidebar({
    super.key,
    this.isVisible = true,
    this.onMySongs,
    this.onMyJamSessions,
    this.onUserAccountPressed,
  });

  @override
  Widget build(BuildContext context) {
    if (!isVisible) {
      return const SizedBox.shrink();
    }

    return Container(
      width: 280,
      decoration: BoxDecoration(
        color: Colors.transparent, // Remove overlay for full transparency
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2), // Subtle white border
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(2, 0),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topRight: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10), // Frosted glass effect
          child: Column(
        children: [
          // Header with logo and title
          Container(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Logo
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFE0B9BE), Color(0xFFC7A2DB), Color(0xFFBD9DFA)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Text(
                      'O',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Oslyn Tabs',
                  style: TextStyle(
                    fontFamily: '.SF Pro Display',
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          
          Divider(height: 1, color: Colors.white.withOpacity(0.2)),
          
          // Navigation items
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Column(
                children: [
                  // My Songs
                  _buildNavigationItem(
                    icon: Icons.music_note,
                    title: 'My Songs',
                    onTap: onMySongs,
                    isPrimary: true,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // My Jam Sessions
                  _buildNavigationItem(
                    icon: Icons.queue_music,
                    title: 'My Jam Sessions',
                    onTap: onMyJamSessions,
                  ),
                ],
              ),
            ),
          ),
          
          // User Account Section at Bottom
          _buildUserAccountSection(),
        ],
      ),
        ),
      ),
    );
  }

  Widget _buildNavigationItem({
    required IconData icon,
    required String title,
    VoidCallback? onTap,
    bool isPrimary = false,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Material(
        color: isPrimary ? Colors.white.withOpacity(0.15) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 16),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isPrimary ? FontWeight.w600 : FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildUserAccountSection() {
    final authService = AuthService();
    final isAuthenticated = authService.isAuthenticated();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A0B3D).withOpacity(0.9), // Darker purple for user section
        border: Border(
          top: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
      ),
      child: isAuthenticated ? _buildAuthenticatedUserInfo() : _buildGuestUserInfo(),
    );
  }

  Widget _buildAuthenticatedUserInfo() {
    final authService = AuthService();
    
    return Row(
      children: [
        // User Avatar
        UserAccountWidget(
          onTap: onUserAccountPressed,
          size: 40,
        ),
        const SizedBox(width: 12),
        // User Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                authService.getUserDisplayName(),
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                authService.currentUserEmail ?? '',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        // Sign Out Button
        IconButton(
          onPressed: () {
            // TODO: Implement sign out
            print('Sign out requested');
          },
          icon: Icon(
            Icons.logout,
            color: Colors.white,
            size: 20,
          ),
          tooltip: 'Sign Out',
        ),
      ],
    );
  }

  Widget _buildGuestUserInfo() {
    return Row(
      children: [
        // Guest Icon
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.grey[200],
            border: Border.all(
              color: Colors.grey[300]!,
              width: 2,
            ),
          ),
          child: Icon(
            Icons.person_outline,
            color: Colors.grey[600],
            size: 20,
          ),
        ),
        const SizedBox(width: 12),
        // Guest Info
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Guest User',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 2),
              Text(
                'Sign in to access your account',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.8),
                ),
              ),
            ],
          ),
        ),
        // Sign In Button
        IconButton(
          onPressed: () {
            // TODO: Show sign in dialog
            print('Sign in requested');
          },
          icon: Icon(
            Icons.login,
            color: Colors.white,
            size: 20,
          ),
          tooltip: 'Sign In',
        ),
      ],
    );
  }
}
