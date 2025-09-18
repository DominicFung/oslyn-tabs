import 'package:flutter/material.dart';

/// A simple half app bar that only covers the right half of the screen
/// This is a more practical implementation for real-world use
class SimpleHalfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final List<Widget>? actions;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double elevation;
  final bool centerTitle;
  final EdgeInsetsGeometry? margin;

  const SimpleHalfAppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation = 4.0,
    this.centerTitle = false,
    this.margin,
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
              margin: margin,
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
                  if (title != null && title!.isNotEmpty)
                    Expanded(
                      child: Text(
                        title!,
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

/// A half app bar with rounded corners and margin from edges
class RoundedHalfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final List<Widget>? actions;
  final Widget? leading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double elevation;
  final bool centerTitle;
  final double borderRadius;
  final EdgeInsetsGeometry? margin;

  const RoundedHalfAppBar({
    super.key,
    this.title,
    this.actions,
    this.leading,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation = 4.0,
    this.centerTitle = false,
    this.borderRadius = 12.0,
    this.margin,
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
            right: 16, // Default margin from edge
            top: 8,    // Default margin from top
            child: Container(
              width: (screenWidth / 2) - 32, // Account for margins
              height: preferredSize.height - 16,
              margin: margin,
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
                  if (title != null && title!.isNotEmpty)
                    Expanded(
                      child: Text(
                        title!,
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
