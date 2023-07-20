import 'package:flutter/cupertino.dart';
import 'package:hgt/const/color_style.dart';

class HgtTheme {
  static const light = CupertinoThemeData(
    brightness: Brightness.light,
    primaryColor: HgtColor.primary,
    // scaffoldBackgroundColor: CupertinoColors.activeGreen
    // textTheme: creator CupertinoTextThemeData()
  );
  static const dark = CupertinoThemeData(
    brightness: Brightness.dark,
    primaryColor: HgtColor.primary,
  );
}
