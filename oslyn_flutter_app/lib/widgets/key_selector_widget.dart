import 'package:flutter/material.dart';

class KeySelectorWidget extends StatefulWidget {
  final String currentKey;
  final String? originalKey;
  final Function(String)? onKeyChanged;
  final Function(String, bool)? onKeyChangedWithSync;
  
  // Available keys from the OslynEngine keyDistanceMap
  static const List<String> availableKeys = [
    'A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab'
  ];

  const KeySelectorWidget({
    super.key,
    required this.currentKey,
    this.originalKey,
    this.onKeyChanged,
    this.onKeyChangedWithSync,
  });

  @override
  State<KeySelectorWidget> createState() => _KeySelectorWidgetState();
}

class _KeySelectorWidgetState extends State<KeySelectorWidget> {
  bool _syncWithAllUsers = true; // Default to syncing with all users

  String _getDisplayText() {
    if (widget.originalKey != null && widget.currentKey == widget.originalKey) {
      return 'Key: ${widget.currentKey} (Original)';
    }
    return 'Key: ${widget.currentKey}';
  }

  List<String> _getKeyOptions() {
    final options = <String>[];
    if (widget.originalKey != null) {
      options.add(widget.originalKey!); // Add original key first
    }
    // Add other keys that aren't the original
    for (final key in KeySelectorWidget.availableKeys) {
      if (key != widget.originalKey) {
        options.add(key);
      }
    }
    return options;
  }

  @override
  Widget build(BuildContext context) {
    final isDisabled = widget.onKeyChanged == null && widget.onKeyChangedWithSync == null;
    
    return GestureDetector(
      onTap: isDisabled ? null : () => _showKeyPicker(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDisabled ? [
              Colors.grey.withValues(alpha: 0.3),
              Colors.grey.withValues(alpha: 0.2),
            ] : [
              Colors.white.withValues(alpha: 0.9),
              Colors.white.withValues(alpha: 0.7),
            ],
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDisabled 
                ? Colors.grey.withValues(alpha: 0.4)
                : Colors.white.withValues(alpha: 0.6),
            width: 1,
          ),
          boxShadow: isDisabled ? null : [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _getDisplayText(),
              style: TextStyle(
                color: isDisabled ? Colors.grey[600] : const Color(0xFF4A5568),
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              isDisabled ? Icons.sync : Icons.keyboard_arrow_down,
              color: isDisabled ? Colors.grey[600] : const Color(0xFF4A5568),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  void _showKeyPicker(BuildContext context) {
    if (widget.onKeyChanged == null && widget.onKeyChangedWithSync == null) return; // Don't show picker if disabled
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.5,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  
                  // Title and Toggle
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.music_note,
                          color: Color(0xFF4A5568),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Select Key',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF4A5568),
                          ),
                        ),
                        const Spacer(),
                        // Toggle for sync with all users
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _syncWithAllUsers ? Icons.sync : Icons.sync_disabled,
                              color: _syncWithAllUsers ? Colors.green : Colors.grey[600],
                              size: 18,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Transpose Key for all users',
                              style: TextStyle(
                                fontSize: 14,
                                color: _syncWithAllUsers ? Colors.green.shade700 : Colors.grey[700],
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Switch(
                              value: _syncWithAllUsers,
                              onChanged: (value) {
                                setModalState(() {
                                  _syncWithAllUsers = value;
                                });
                              },
                              activeColor: Colors.green,
                              activeTrackColor: Colors.green.shade200,
                              inactiveThumbColor: Colors.grey.shade400,
                              inactiveTrackColor: Colors.grey.shade300,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
              
              const Divider(height: 1),
              
              // Key list
              Expanded(
                child: ListView.builder(
                  itemCount: _getKeyOptions().length,
                  itemBuilder: (context, index) {
                    final keyOptions = _getKeyOptions();
                    final key = keyOptions[index];
                    final isSelected = key == widget.currentKey;
                    final isOriginal = widget.originalKey != null && key == widget.originalKey;
                    
                    String displayText = key;
                    if (isOriginal && index == 0) {
                      displayText = 'Original: $key';
                    }
                    
                    return ListTile(
                      title: Text(
                        displayText,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                          color: isSelected ? const Color(0xFF4A5568) : Colors.grey[700],
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(
                              Icons.check,
                              color: Color(0xFF4A5568),
                            )
                          : null,
                      onTap: () {
                        if (widget.onKeyChangedWithSync != null) {
                          widget.onKeyChangedWithSync!(key, _syncWithAllUsers);
                        } else if (widget.onKeyChanged != null) {
                          widget.onKeyChanged!(key);
                        }
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
