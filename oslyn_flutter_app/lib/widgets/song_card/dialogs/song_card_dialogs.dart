import 'package:flutter/material.dart';
import '../../../widgets/qr_generator_widget.dart';

class SongCardDialogs {
  static void showTextSizeDialog({
    required BuildContext context,
    required String currentTextSize,
    required Function(String) onTextSizeChanged,
  }) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Text Size'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildTextSizeOption(context, 'dynamic', 'Dynamic (Auto)', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-xs', 'Extra Small', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-sm', 'Small', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-base', 'Base', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-lg', 'Large', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-xl', 'Extra Large', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-2xl', '2XL', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-3xl', '3XL', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-4xl', '4XL', currentTextSize, onTextSizeChanged),
                _buildTextSizeOption(context, 'text-5xl', '5XL', currentTextSize, onTextSizeChanged),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('Close'),
            ),
          ],
        );
      },
    );
  }

  static Widget _buildTextSizeOption(
    BuildContext context,
    String value,
    String label,
    String currentTextSize,
    Function(String) onTextSizeChanged,
  ) {
    return ListTile(
      title: Text(label),
      leading: Radio<String>(
        value: value,
        groupValue: currentTextSize,
        onChanged: (String? newValue) {
          if (newValue != null) {
            onTextSizeChanged(newValue);
            Navigator.of(context).pop();
          }
        },
      ),
      onTap: () {
        onTextSizeChanged(value);
        Navigator.of(context).pop();
      },
    );
  }

  static void showQRCodeDialog({
    required BuildContext context,
    required String jamSessionId,
    String? pin,
  }) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: QRGeneratorWidget(
              jamSessionId: jamSessionId,
              pin: pin,
              onClose: () => Navigator.of(context).pop(),
            ),
          ),
        );
      },
    );
  }

  static void showSettingsMenu({
    required BuildContext context,
    required VoidCallback onToggleTopBarDisable,
    required VoidCallback onToggleContainerOutlines,
    required VoidCallback onShowTextSizeDialog,
    required VoidCallback onShowQRCodeDialog,
    required VoidCallback onShowUserAccountMenu,
    required VoidCallback onShowQueueManagement,
  }) {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.visibility_off),
                title: const Text('Toggle Top Bar'),
                onTap: () {
                  onToggleTopBarDisable();
                  Navigator.of(context).pop();
                },
              ),
              ListTile(
                leading: const Icon(Icons.border_outer),
                title: const Text('Toggle Container Outlines'),
                onTap: () {
                  onToggleContainerOutlines();
                  Navigator.of(context).pop();
                },
              ),
              ListTile(
                leading: const Icon(Icons.text_fields),
                title: const Text('Text Size'),
                onTap: () {
                  Navigator.of(context).pop();
                  onShowTextSizeDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.qr_code),
                title: const Text('Show QR Code'),
                onTap: () {
                  Navigator.of(context).pop();
                  onShowQRCodeDialog();
                },
              ),
              ListTile(
                leading: const Icon(Icons.account_circle),
                title: const Text('User Account'),
                onTap: () {
                  Navigator.of(context).pop();
                  onShowUserAccountMenu();
                },
              ),
              ListTile(
                leading: const Icon(Icons.queue_music),
                title: const Text('Queue Management'),
                onTap: () {
                  Navigator.of(context).pop();
                  onShowQueueManagement();
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
