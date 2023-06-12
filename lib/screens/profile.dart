import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/splash.dart';
import 'package:hgt/services/loginDataControl.dart';
import 'package:provider/provider.dart';
import '../const/textStyle.dart';
import '../object/properties.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../widget/multiSelectBottomSheet.dart';

class Profile extends StatefulWidget {
  _ProfileState createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  List<String> selectedP = [];
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
    return CupertinoPageScaffold(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              MyInfo(),
              MyProperty(),
              CupertinoButton.filled(
                  child: Text(
                    "로그아웃",
                    style: HgtText.p,
                  ),
                  onPressed: () {
                    ctrl.removeLoginData();
                    Navigator.of(context).pushNamedAndRemoveUntil(
                      '/splash',
                      (route) => true,
                    );
                  })
            ],
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
    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Container(
          height: 48,
          // decoration: HgtBox.test,
          alignment: Alignment.centerLeft,
          child: Text(
            "C동3층고양이",
            style: HgtText.Title,
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
                  alignment: Alignment.centerLeft,
                  // decoration: HgtBox.test,
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
                    // decoration: HgtBox.test,
                    alignment: Alignment.centerRight,
                    child: Text(
                      "이태훈",
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
                      "27",
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
                      "B513077",
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
                      "토목공학과",
                      style: HgtText.p,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class MyProperty extends StatefulWidget {
  const MyProperty({super.key});

  @override
  State<MyProperty> createState() => _MyPropertyState();
}

class _MyPropertyState extends State<MyProperty> {
  final _selectedMyProperties = [Properties(0, "성실함"), Properties(1, "근자감")];

  @override
  Widget build(BuildContext context) {
    // return Column(children: <Widget>[
    //   ListView.builder(
    //       shrinkWrap: true,
    //       itemCount: _selectedMyProperties.length,
    //       // scrollDirection: Axis.horizontal,
    //       itemBuilder: ((context, index) {
    //         Properties item =
    //             _selectedMyProperties[index % _selectedMyProperties.length];
    //         return propertyBox(item.property);
    //       })),
    // ]);
    return propertyBox(_selectedMyProperties[0].property);
  }

  Widget propertyBox(e) {
    return Container(
        decoration: HgtBox.test,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16.0, 8.0, 16.0, 8.0),
          child: Text(e),
        ));
  }
}
