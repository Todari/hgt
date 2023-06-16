import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/textStyle.dart';
import 'package:provider/provider.dart';

class Home extends StatefulWidget {
  _HomeState createState() => _HomeState();
}

class _HomeState extends State<Home> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
        child: Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Container(
            height: 48,
            decoration: HgtBox.test,
            alignment: Alignment.centerLeft,
            child: Text(
              "오늘의 소개가 도착했어요 🥰",
              style: HgtText.Title,
            ),
          )
        ],
      ),
    ));
  }
}
