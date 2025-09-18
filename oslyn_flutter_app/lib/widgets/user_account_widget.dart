import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class UserAccountWidget extends StatelessWidget {
  final VoidCallback? onTap;
  final double size;
  final bool showTooltip;

  const UserAccountWidget({
    Key? key,
    this.onTap,
    this.size = 40.0,
    this.showTooltip = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    
    if (!authService.isAuthenticated()) {
      return _buildGuestIcon(context);
    }

    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: showTooltip ? 'Account: ${authService.getUserDisplayName()}' : '',
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                Colors.purple[400]!,
                Colors.purple[600]!,
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Center(
            child: Text(
              authService.getUserInitials(),
              style: TextStyle(
                color: Colors.white,
                fontSize: size * 0.4,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGuestIcon(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Tooltip(
        message: showTooltip ? 'Sign in to access your account' : '',
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.grey[300],
            border: Border.all(
              color: Colors.grey[400]!,
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Icon(
            Icons.person_outline,
            color: Colors.grey[600],
            size: size * 0.5,
          ),
        ),
      ),
    );
  }
}

class UserAccountMenu extends StatelessWidget {
  final VoidCallback? onSignOut;
  final VoidCallback? onClose;

  const UserAccountMenu({
    Key? key,
    this.onSignOut,
    this.onClose,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    
    if (!authService.isAuthenticated()) {
      return _buildGuestMenu(context);
    }

    return Container(
      width: 280,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // User Avatar and Info
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [
                      Colors.purple[400]!,
                      Colors.purple[600]!,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Center(
                  child: Text(
                    authService.getUserInitials(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      authService.getUserDisplayName(),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      authService.currentUserEmail ?? '',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Menu Items
          _buildMenuItem(
            icon: Icons.person,
            title: 'Profile',
            onTap: () {
              onClose?.call();
              // TODO: Navigate to profile page
            },
          ),
          
          _buildMenuItem(
            icon: Icons.settings,
            title: 'Settings',
            onTap: () {
              onClose?.call();
              // TODO: Navigate to settings page
            },
          ),
          
          _buildMenuItem(
            icon: Icons.help_outline,
            title: 'Help & Support',
            onTap: () {
              onClose?.call();
              // TODO: Navigate to help page
            },
          ),
          
          const Divider(height: 20),
          
          _buildMenuItem(
            icon: Icons.logout,
            title: 'Sign Out',
            onTap: () {
              onClose?.call();
              onSignOut?.call();
            },
            textColor: Colors.red[600],
            iconColor: Colors.red[600],
          ),
        ],
      ),
    );
  }

  Widget _buildGuestMenu(BuildContext context) {
    return Container(
      width: 280,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Guest Icon and Info
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
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
                  size: 30,
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Guest User',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Sign in to access your account',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Sign In Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                onClose?.call();
                // TODO: Show sign in dialog
              },
              icon: const Icon(Icons.login, size: 20),
              label: const Text('Sign In'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
    Color? iconColor,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Row(
          children: [
            Icon(
              icon,
              color: iconColor ?? Colors.grey[600],
              size: 20,
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                color: textColor ?? Colors.black87,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
