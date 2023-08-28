import 'package:flutter/cupertino.dart';
import 'package:hgt/const/box_style.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/const/text_style.dart';
import 'package:hgt/services/login_data_control.dart';
import 'login.dart';

class Menu extends StatefulWidget {
  const Menu({super.key});

  @override
  State<Menu> createState() => _MenuState();
}

class _MenuState extends State<Menu> {
  final ctrl = LoginDataCtrl();
  List<String> menuList = [
    "설정",
    "로그아웃"
  ]; //TODO : List<Map<String, Widget>> -> text, widget
  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
        navigationBar: CupertinoNavigationBar(
          // middle: Text(
          //   "내 프로필",
          //   style: HgtText.large(HgtColor.primary),
          // ),
          backgroundColor: HgtColor.white,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: ListView.builder(
            itemCount: menuList.length,
            itemBuilder: (BuildContext context, int index) {
              return menuItem(menuList[index]);
            },
          ),
        ));
  }

  Widget menuItem(text) {
    return GestureDetector(
        child: Container(
          // decoration: HgtBox.test,
          padding: const EdgeInsets.symmetric(
            vertical: 16,
            horizontal: 24,
          ),
          child: Text(
            text,
            style: HgtText.medium(HgtColor.black),
            textAlign: TextAlign.left,
          ),
        ),
        onTap: text == "로그아웃"
            ? () async {
                ctrl.removeLoginData();
                Navigator.pushReplacement(context,
                    CupertinoPageRoute(builder: ((context) => const Login())));
              }
            : () {});
  }
}
// 