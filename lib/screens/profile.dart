import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/services/loginDataControl.dart';
import 'package:provider/provider.dart';
import '../const/textStyle.dart';

class Profile extends StatefulWidget {
  _ProfileState createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  final ctrl = LoginDataCtrl();
  // HgtUser hgtUser = HgtUser("", "", "", 0);

  @override
  void initState() {
    // TODO: implement initState
    super.initState();
    // HgtUser hgtUser = GetIt.I<HgtUser>(instanceName: "userInfo");
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                MyInfo(),
                MyAppeal(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MyInfo extends StatefulWidget {
  const MyInfo({super.key});

  @override
  State<MyInfo> createState() => _MyInfoState();
}

class _MyInfoState extends State<MyInfo> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    alignment: Alignment.centerLeft,
                    decoration: HgtBox.test,
                    width: 48,
                    child: Text(
                      "이름",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      decoration: HgtBox.test,
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-name",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "나이",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-age",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "학번",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-studentId",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "전공",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-major",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class MyAppeal extends StatefulWidget {
  const MyAppeal({super.key});

  @override
  State<MyAppeal> createState() => _MyAppealState();
}

class _MyAppealState extends State<MyAppeal> {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    alignment: Alignment.centerLeft,
                    decoration: HgtBox.test,
                    width: 48,
                    child: Text(
                      "이름",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      decoration: HgtBox.test,
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-name",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "나이",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-age",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "학번",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-studentId",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(
              vertical: 8.0,
            ),
            child: Container(
              child: Row(
                children: [
                  Container(
                    width: 48,
                    child: Text(
                      "전공",
                      style: HgtText.p,
                    ),
                  ),
                  SizedBox(
                    width: 16,
                  ),
                  Expanded(
                    child: Container(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "user-major",
                        style: HgtText.p,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
