import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hgt/screens/splash.dart';
import 'dart:async';

import 'package:hgt/services/loginDataControl.dart';

class Home extends StatefulWidget {
  _HomeState createState() => _HomeState();
}

class _HomeState extends State<Home> {
  @override
  Widget build(BuildContext context) {
    return CupertinoApp(
      home: CupertinoPageScaffold(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("good"),
              SizedBox(
                height: 32,
              ),
              CupertinoButton(
                child: Text("log out"),
                onPressed: () {
                  _logOut();
                },
              )
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _logOut() async {
    var ctrl = new LoginDataCtrl();
    Navigator.push(
      context,
      CupertinoPageRoute(
        builder: (context) => Splash(),
      ),
    );
    ctrl.removeLoginData();
  }
}
// 