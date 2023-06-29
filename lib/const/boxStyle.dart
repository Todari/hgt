import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/colorStyle.dart';

class HgtBox {
  static BoxDecoration test = BoxDecoration(
    border: Border.all(color: Colors.black),
  );

  static BoxDecoration bg = BoxDecoration(
    color: CupertinoColors.white,
  );

  static BoxDecoration chip = BoxDecoration(
    border: Border.all(color: HgtColor.b8),
    borderRadius: BorderRadius.circular(8),
  );

  static BoxDecoration chipSelected = BoxDecoration(
    color: HgtColor.p,
    border: Border.all(color: HgtColor.p),
    borderRadius: BorderRadius.circular(8),
  );
}
