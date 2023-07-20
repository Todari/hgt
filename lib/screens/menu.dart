import 'package:flutter/cupertino.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/const/text_style.dart';

class Menu extends StatefulWidget {
  const Menu({super.key});

  @override
  State<Menu> createState() => _MenuState();
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
        child: const Text("아"));
  }
}
// 