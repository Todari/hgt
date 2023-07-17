import 'package:flutter/cupertino.dart';
import 'package:hgt/const/colorStyle.dart';

class HgtTheme {
  static final light = CupertinoThemeData(
    brightness: Brightness.light,
    primaryColor: HgtColor.primary,
    // scaffoldBackgroundColor: CupertinoColors.activeGreen
    // textTheme: creator CupertinoTextThemeData()
  );
  static final dark = CupertinoThemeData(
    brightness: Brightness.dark,
    primaryColor: HgtColor.primary,
  );
}
