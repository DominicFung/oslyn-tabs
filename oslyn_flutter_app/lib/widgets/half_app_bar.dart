import 'package:flutter/material.dart';

class HalfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double elevation;
  final bool centerTitle;

  const HalfAppBar({
    super.key,
    this.title = '',
    this.actions,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation = 4.0,
    this.centerTitle = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    
    return Container(
      height: preferredSize.height,
      child: Row(
        children: [
          // Left half - empty space
          Expanded(
            child: Container(
              color: Colors.transparent,
            ),
          ),
          // Right half - app bar content
          Expanded(
            child: Container(
              height: preferredSize.height,
              decoration: BoxDecoration(
                color: backgroundColor ?? colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: elevation,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Leading widget (if provided)
                  if (leading != null) ...[
                    leading!,
                    const SizedBox(width: 8),
                  ],
                  // Title
                  if (title.isNotEmpty)
                    Expanded(
                      child: Text(
                        title,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: foregroundColor ?? colorScheme.onSurface,
                        ),
                        textAlign: centerTitle ? TextAlign.center : TextAlign.start,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  // Actions
                  if (actions != null) ...[
                    const SizedBox(width: 8),
                    ...actions!,
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// Alternative approach using Stack for more control
class StackedHalfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double elevation;
  final bool centerTitle;

  const StackedHalfAppBar({
    super.key,
    this.title = '',
    this.actions,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation = 4.0,
    this.centerTitle = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final screenWidth = MediaQuery.of(context).size.width;
    
    return Container(
      height: preferredSize.height,
      child: Stack(
        children: [
          // Right half app bar
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              width: screenWidth / 2,
              height: preferredSize.height,
              decoration: BoxDecoration(
                color: backgroundColor ?? colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: elevation,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Leading widget (if provided)
                  if (leading != null) ...[
                    leading!,
                    const SizedBox(width: 8),
                  ],
                  // Title
                  if (title.isNotEmpty)
                    Expanded(
                      child: Text(
                        title,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: foregroundColor ?? colorScheme.onSurface,
                        ),
                        textAlign: centerTitle ? TextAlign.center : TextAlign.start,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  // Actions
                  if (actions != null) ...[
                    const SizedBox(width: 8),
                    ...actions!,
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

// Custom app bar with rounded corners for the right half
class RoundedHalfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double elevation;
  final bool centerTitle;
  final double borderRadius;

  const RoundedHalfAppBar({
    super.key,
    this.title = '',
    this.actions,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation = 4.0,
    this.centerTitle = false,
    this.borderRadius = 12.0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final screenWidth = MediaQuery.of(context).size.width;
    
    return Container(
      height: preferredSize.height,
      child: Stack(
        children: [
          // Right half app bar with rounded corners
          Positioned(
            right: 16, // Add some margin from the edge
            top: 8,    // Add some margin from the top
            child: Container(
              width: (screenWidth / 2) - 16,
              height: preferredSize.height - 16,
              decoration: BoxDecoration(
                color: backgroundColor ?? colorScheme.surface,
                borderRadius: BorderRadius.circular(borderRadius),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: elevation,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Leading widget (if provided)
                  if (leading != null) ...[
                    leading!,
                    const SizedBox(width: 8),
                  ],
                  // Title
                  if (title.isNotEmpty)
                    Expanded(
                      child: Text(
                        title,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: foregroundColor ?? colorScheme.onSurface,
                        ),
                        textAlign: centerTitle ? TextAlign.center : TextAlign.start,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  // Actions
                  if (actions != null) ...[
                    const SizedBox(width: 8),
                    ...actions!,
                    const SizedBox(width: 8),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
