import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/colorStyle.dart';
import 'package:hgt/const/textStyle.dart';

class Menu extends StatefulWidget {
  _MenuState createState() => _MenuState();
}

class _MenuState extends State<Menu> {
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          middle: Text(
            "내 프로필",
            style: HgtText.large(HgtColor.primary),
          ),
          backgroundColor: HgtColor.white,
        ),
        child: Text("아"));
  }
}
// 