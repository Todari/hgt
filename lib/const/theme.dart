import 'package:flutter/cupertino.dart';

class HgtTheme {
  static const light = CupertinoThemeData(
    brightness: Brightness.light,
    primaryColor: CupertinoColors.activeOrange,
    // scaffoldBackgroundColor: CupertinoColors.activeGreen
    // textTheme: creator CupertinoTextThemeData()
  );
  static const dark = CupertinoThemeData(
    brightness: Brightness.dark,
    primaryColor: CupertinoColors.activeOrange,
  );
}
