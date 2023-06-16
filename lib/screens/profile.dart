import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/login.dart';
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
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            MyInfo(),
            SizedBox(
              height: 64,
            ),
            // MyProperty(),
            CupertinoButton.filled(
                child: Text(
                  "로그아웃",
                  style: HgtText.p,
                ),
                onPressed: () {
                  ctrl.removeLoginData();
                  Navigator.pop(context);
                })
          ],
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
  double _kItemExtent = 32.0;
  List<String> _religions = ["무교", "기독교", "천주교", "불교", "이슬람교", "기타"];
  int _selectedReligion = 0;
  var religion = "-";

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
            "내정보",
            style: HgtText.Title,
          ),
        ),
        infoItem("이름", GetIt.I<HgtUser>(instanceName: "userInfo").name),
        infoItem(
            "학번 / 나이",
            GetIt.I<HgtUser>(instanceName: "userInfo")
                    .studentId
                    .substring(0, 2)
                    .replaceAll('A', '0')
                    .replaceAll('B', '1')
                    .replaceAll('C', '2') +
                "학번 / 만 " +
                GetIt.I<HgtUser>(instanceName: "userInfo").age +
                " 세"),
        infoItem("전공", GetIt.I<HgtUser>(instanceName: "userInfo").major),
        infoItem("키", "-키-"),
        GestureDetector(
          child: infoItem("종교", religion),
          onTap: () {
            _showDialog(
              CupertinoPicker(
                magnification: 1.22,
                squeeze: 1,
                useMagnifier: true,
                itemExtent: _kItemExtent,
                // This sets the initial item.
                scrollController: FixedExtentScrollController(
                  initialItem: _selectedReligion,
                ),
                // This is called when selected item is changed.
                onSelectedItemChanged: (int selectedItem) {
                  setState(() {
                    _selectedReligion = selectedItem;
                    religion = _religions[_selectedReligion];
                  });
                },
                children: List<Widget>.generate(_religions.length, (int index) {
                  return Center(child: Text(_religions[index]));
                }),
              ),
            );
          },
        ),
        infoItem("흡연여부", "흡연/전자담배/비흡연"),
      ],
    );
  }

  Widget infoItem(title, text) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 16.0,
      ),
      child: Container(
        decoration: HgtBox.bg,
        child: Row(
          children: [
            Container(
              alignment: Alignment.centerLeft,
              // decoration: HgtBox.test,
              width: 80,
              child: Text(
                title,
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
                  text,
                  style: HgtText.p,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDialog(Widget child) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => Container(
        height: 320,
        padding: const EdgeInsets.only(top: 6.0),
        // The Bottom margin is provided to align the popup above the system navigation bar.
        margin: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        // Provide a background color for the popup.
        color: CupertinoColors.systemBackground.resolveFrom(context),
        // Use a SafeArea widget to avoid system overlaps.
        child: SafeArea(
          top: false,
          child: child,
        ),
      ),
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
