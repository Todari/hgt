import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/login.dart';
import 'package:hgt/services/loginDataControl.dart';
import 'package:provider/provider.dart';
import '../const/textStyle.dart';
import '../object/property.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import '../http/http.dart';
import 'package:flutter_multi_select_items/flutter_multi_select_items.dart';
import 'package:cupertino_range_slider_improved/cupertino_range_slider.dart';

class Profile extends StatefulWidget {
  _ProfileState createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  List<String> selectedP = [];
  final ctrl = LoginDataCtrl();
  late ScrollController _scrollController;
  // HgtUser hgtUser = HgtUser("", "", "", 0);

  @override
  void initState() {
    _scrollController = ScrollController();
    super.initState();
    // HgtUser hgtUser = GetIt.I<HgtUser>(instanceName: "userInfo");
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: ListView(
            children: [
              MyInfo(), // MyProperty(),
              CupertinoButton.filled(
                child: Text(
                  "로그아웃",
                  style: HgtText.p,
                ),
                onPressed: () {
                  ctrl.removeLoginData();
                  Navigator.pop(context);
                },
              )
            ],
          ),
        ),
      ),
    );
  }
}

class MyInfo extends StatefulWidget {
  @override
  State<MyInfo> createState() => _MyInfoState();
}

class _MyInfoState extends State<MyInfo> {
  late TextEditingController _heightController;
  double _kItemExtent = 32.0;
  List<String> _religions = ["무교", "기독교", "천주교", "불교", "이슬람교", "기타"];
  int _selectedReligion = 0;
  List<String> _smokes = ["흡연", "술마실 때만", "전자담배", "비흡연"];
  int _selectedSmoke = 0;
  var user = GetIt.I<HgtUser>(instanceName: "userInfo");

  List<String> p = [
    "열정맨",
    "지능캐",
    "핫바디",
    "너드미",
    "과탑",
    "인싸",
    "존잘존예",
    "훈남훈녀",
    "취미부자"
  ];
  List<String> hobby = [
    "열정맨",
    "지능캐",
    "핫바디",
    "너드미",
    "과탑",
    "인싸",
    "존잘존예",
    "훈남훈녀",
    "취미부자"
  ];
  var http = HgtHttp();

  Property userProperty = Property("", "", "", []);

  @override
  void initState() {
    _getProperty(user.studentId);
    _heightController = TextEditingController(text: userProperty.height);
    super.initState();
  }

  @override
  void dispose() {
    _heightController.dispose();
    super.dispose();
  }

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
        infoItem("이름", user.name),
        infoItem(
            "학번 / 나이",
            user.studentId
                    .substring(0, 2)
                    .replaceAll('A', '0')
                    .replaceAll('B', '1')
                    .replaceAll('C', '2') +
                "학번 / " +
                user.age +
                " 세"),
        infoItem("단과대", user.major.split(' ')[0]),
        infoItem(
            "전공",
            user.major.substring(
              user.major.split(' ')[0].length + 1,
            )),
        Container(
          padding: const EdgeInsets.symmetric(
            vertical: 16.0,
          ),
          decoration: HgtBox.bg,
          child: Row(
            children: [
              Container(
                alignment: Alignment.centerLeft,
                // decoration: HgtBox.test,
                width: 80,
                child: Text(
                  "키",
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
                  child: CupertinoTextField.borderless(
                    maxLength: 3,
                    controller: _heightController,
                    style: HgtText.p,
                    textAlign: TextAlign.right,
                    onChanged: (value) {
                      if (int.parse(value) > 230) {
                        setState(() {
                          value = "230";
                          _heightController.text = value;
                        });
                      }
                      setState(() {
                        userProperty.height = _heightController.text;
                      });
                    },
                    onSubmitted: (value) {
                      if (int.parse(value) < 130) {
                        setState(() {
                          value = "130";
                          _heightController.text = value;
                        });
                      }
                      setState(() {
                        userProperty.height = _heightController.text;
                      });
                    },
                    suffix: Text("cm"),
                  ),
                ),
              ),
            ],
          ),
        ),
        GestureDetector(
          child: infoItem("종교", userProperty.religion),
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
                    userProperty.religion = _religions[_selectedReligion];
                  });
                },
                children: List<Widget>.generate(_religions.length, (int index) {
                  return Center(child: Text(_religions[index]));
                }),
              ),
            );
          },
        ),
        GestureDetector(
          child: infoItem("흡연여부", userProperty.smoke),
          onTap: () {
            _showDialog(
              CupertinoPicker(
                magnification: 1.22,
                squeeze: 1,
                useMagnifier: true,
                itemExtent: _kItemExtent,
                // This sets the initial item.
                scrollController: FixedExtentScrollController(
                  initialItem: _selectedSmoke,
                ),
                // This is called when selected item is changed.
                onSelectedItemChanged: (int selectedItem) {
                  setState(() {
                    _selectedSmoke = selectedItem;
                    userProperty.smoke = _smokes[_selectedSmoke];
                  });
                },
                children: List<Widget>.generate(_smokes.length, (int index) {
                  return Center(child: Text(_smokes[index]));
                }),
              ),
            );
          },
        ),
        multiSelector(p),
        multiSelector(hobby),
        rangeSelector("", 130.0, 230.0, 130.0, 230.0),
        CupertinoButton.filled(
          child: Text(
            "변경완료",
            style: HgtText.p,
          ),
          onPressed: () async {
            await http.updateProperty(user.studentId, userProperty);
          },
        ),
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
                  textAlign: TextAlign.right,
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

  Future<void> _getProperty(studentId) async {
    var property = await http.getProperty(studentId);
    print(property);
    setState(() {
      userProperty = property;
      _heightController.text = property.height;
    });
  }

  Widget multiSelector(list) {
    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 16,
      ),
      width: double.infinity,
      // decoration: HgtBox.test,
      child: MultiSelectContainer(
          itemsPadding: EdgeInsets.fromLTRB(8, 4, 8, 4),
          maxSelectableCount: 5,
          itemsDecoration: MultiSelectDecorations(
            decoration: HgtBox.chip,
            selectedDecoration: HgtBox.chipSelected,
          ),
          textStyles: MultiSelectTextStyles(
            textStyle: HgtText.p2b8,
            selectedTextStyle: HgtText.p2w,
          ),
          items: [
            for (var i in list)
              MultiSelectCard(
                // textStyles: MultiSelectItemTextStyles(
                //   textStyle: HgtText.p,
                //   selectedTextStyle: HgtText.p,
                // ),
                value: i,
                label: i,
                // decorations:
                // MultiSelectItemDecorations(decoration: HgtBox.test),
              )
          ],
          onChange: (allSelectedItems, selectedItem) {
            print("allSelectedItems : $allSelectedItems");
            print("selectedItem : $selectedItem");
          }),
    );
  }

  Widget rangeSelector(title, minV, maxV, min, max) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16),
      width: double.infinity,
      child: CupertinoRangeSlider(
        minValue: minV,
        maxValue: maxV,
        min: min,
        max: max,
        onMinChanged: (minVal) {},
        onMaxChanged: (maxVal) {},
      ),
    );
  }
}
