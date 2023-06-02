import 'package:flutter/cupertino.dart';
import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/http/customException.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/services/loginDataControl.dart';
import '../http/Crawl.dart';

import 'home.dart';

class Splash extends StatefulWidget {
  const Splash({Key? key}) : super(key: key);

  @override
  _HomeState createState() => _HomeState();
}

class _HomeState extends State<Splash> {
  late TextEditingController _idController;
  late TextEditingController _pwController;
  // NyanUser userInfo = NyanUser('', '');
  // List<Lecture> classesInfo = [];
  String saved_id = "", saved_pw = "";
  HgtUser userInfo = HgtUser("", "", "", 0);
  // bool _loadingVisible = false;

  @override
  void initState() {
    _idController = TextEditingController();
    _pwController = TextEditingController();
    super.initState();
  }

  @override
  void dispose() {
    _idController.dispose();
    _pwController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      home: CupertinoPageScaffold(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CupertinoTextField(
              controller: _idController,
            ),
            SizedBox(
              height: 16,
            ),
            CupertinoTextField(
              controller: _pwController,
            ),
            SizedBox(
              height: 16,
            ),
            CupertinoButton(
                child: Text("GABOZAGO"),
                onPressed: () async {
                  var ctrl = new LoginDataCtrl();
                  await ctrl.saveLoginData(
                      _idController.text, _pwController.text);
                  await classNetLogin();
                })
          ],
        ),
      ),
    );
  }

  Future<void> classNetLogin() async {
    var ctrl = new LoginDataCtrl();
    var assurance = await ctrl.loadLoginData();
    saved_id = assurance["user_id"] ?? "";
    saved_pw = assurance["user_pw"] ?? "";
    Crawl.id = saved_id;
    Crawl.pw = saved_pw;
    var crawl = new Crawl();

    try {
      try {
        userInfo = GetIt.I<HgtUser>(instanceName: "userInfo");
      } catch (e) {
        await crawl.crawlUser();
        userInfo = GetIt.I<HgtUser>(instanceName: "userInfo");
      }

      Navigator.push(
        context,
        CupertinoPageRoute(
          builder: (context) => Home(),
        ),
      );

      print("user saved : ${saved_id + saved_pw}");
    } on CustomException {
      print("customexception");
    }
  }
}
