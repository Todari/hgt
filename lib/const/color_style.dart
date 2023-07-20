import 'package:flutter/cupertino.dart';

class HgtColor {
  static Color black = CupertinoColors.black;
  static Color grey = CupertinoColors.systemGrey;
  static Color grey2 = CupertinoColors.systemGrey2;
  static Color white = CupertinoColors.white;

  // static Color primary = Color.fromARGB(255, 177, 178, 255);
  // static Color secondary = Color.fromARGB(255, 212, 163, 255);
  // static Color tertiary = Color.fromARGB(255, 163, 213, 255);
  // static Color primaryT(a) {
  //   return Color.fromARGB((a / 100 * 255).round(), 177, 178, 255);
  // }

  // static Color secondaryT(a) {
  //   return Color.fromARGB((a / 100 * 255).round(), 212, 163, 255);
  // }

  // static Color tertiaryT(a) {
  //   return Color.fromARGB((a / 100 * 255).round(), 163, 213, 255);
  // }

  static const Color primary = Color.fromARGB(255, 218, 143, 255);
  static const Color secondary = Color.fromARGB(255, 255, 105, 97);
  static const Color tertiary = Color.fromARGB(255, 225, 204, 236);
  static const Color bg = Color.fromARGB(255, 241, 241, 246);
  static Color primaryT(a) {
    return Color.fromARGB((a / 100 * 255).round(), 218, 143, 255);
  }

  static Color secondaryT(a) {
    return Color.fromARGB((a / 100 * 255).round(), 255, 105, 97);
  }

  static Color tertiaryT(a) {
    return Color.fromARGB((a / 100 * 255).round(), 225, 204, 236);
  }
}
