import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:hgt/components/multi_selector_bottom_sheet.dart';
import 'package:hgt/const/box_style.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/object/user.dart';
import 'package:hgt/screens/login.dart';
import 'package:hgt/components/mbti_picker_bottomsheet.dart';
import 'package:hgt/services/login_data_control.dart';
import '../const/text_style.dart';
import '../object/property.dart';
import '../http/http.dart';
import 'package:cupertino_range_slider_improved/cupertino_range_slider.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';

class Profile extends StatefulWidget {
  const Profile({super.key});
  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  final ctrl = LoginDataCtrl();
  late ScrollController _scrollController;
  final double _kItemExtent = 32.0;
  final List<String> _religions = ["무교", "기독교", "천주교", "불교", "이슬람교", "기타"];
  int _selectedReligion = 0;
  final List<String> _smokes = ["흡연", "술마실 때만", "전자담배", "비흡연"];
  int _selectedSmoke = 0;
  final _heights = List<int>.generate(50, (i) => i + 150);
  int _selectedHeight = 0;
  var user = GetIt.I<HgtUser>(instanceName: "userInfo");
  List<dynamic> _selectedKeywords = [];
  List<dynamic> _selectedHobbies = [];
  var _isChecked = false;

  var http = HgtHttp();

  Property userProperty = Property([], "", "", "", [], []);

  @override
  void initState() {
    _scrollController = ScrollController();
    _getProperty(user.studentId);
    // _heightController = TextEditingController(text: userProperty.height);
    print("go to profile widget");
    super.initState();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    // _heightController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text(
          "내 프로필",
          style: HgtText.titleLarge(HgtColor.black),
        ),
        backgroundColor: HgtColor.white,
      ),
      child: ListView(children: [
        Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            titleWidget("학사정보"),
            Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: 8.0, horizontal: 24),
              child: Column(
                children: [
                  infoItem("이름", user.name),
                  // infoItem(
                  //     "학번 / 나이",
                  //     user.studentId
                  //             .substring(0, 2)
                  //             .replaceAll('A', '0')
                  //             .replaceAll('B', '1')
                  //             .replaceAll('C', '2') +
                  //         "학번 / " +
                  //         user.age +
                  //         " 세"),
                  infoItem("학번 / 나이",
                      "${user.studentId.substring(0, 2).replaceAll('A', '0').replaceAll('B', '1').replaceAll('C', '2')}학번 / ${user.age}세"),
                  infoItem("단과대", user.major.split(' ')[0]),
                  infoItem(
                    "전공",
                    user.major.substring(
                      user.major.split(' ')[0].length + 1,
                    ),
                  ),
                  Container(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(
                          "같은 전공 만나지 않기",
                          style: HgtText.bodyTinyRegular(HgtColor.grey),
                          textAlign: TextAlign.right,
                        ),
                        CupertinoCheckbox(
                          value: _isChecked,
                          onChanged: (isChecked) {
                            setState(() {
                              _isChecked = isChecked!;
                            });
                            print(_isChecked);
                          },
                        ),
                      ],
                    ),
                  )
                ],
              ),
            ),
            titleWidget("개인정보"),
            const SizedBox(
              height: 8,
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoItemSelectable("MBTI", userProperty.mbti),
              ),
              onTap: () {
                _showDialog(const MbtiSelectBottomSheet());
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoItemSelectable("키", userProperty.height),
              ),
              onTap: () {
                _showDialog(
                  CupertinoPicker(
                    magnification: 1.22,
                    squeeze: 1,
                    useMagnifier: true,
                    itemExtent: _kItemExtent,
                    // This sets the initial item.
                    scrollController: FixedExtentScrollController(
                      initialItem: _selectedHeight,
                    ),
                    // This is called when selected item is changed.
                    onSelectedItemChanged: (int selectedItem) {
                      setState(() {
                        _selectedHeight = selectedItem;
                        userProperty.height =
                            _heights[_selectedHeight].toString();
                      });
                    },
                    children:
                        List<Widget>.generate(_heights.length, (int index) {
                      return Center(child: Text(_heights[index].toString()));
                    }),
                  ),
                );
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoItemSelectable("종교", userProperty.religion),
              ),
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
                    children:
                        List<Widget>.generate(_religions.length, (int index) {
                      return Center(child: Text(_religions[index]));
                    }),
                  ),
                );
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoItemSelectable("흡연여부", userProperty.smoke),
              ),
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
                    children:
                        List<Widget>.generate(_smokes.length, (int index) {
                      return Center(child: Text(_smokes[index]));
                    }),
                  ),
                );
              },
            ),
            const SizedBox(
              height: 8,
            ),
            titleWidget("키워드"),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoMultiItemSelectable(userProperty.keywords),
              ),
              onTap: () {
                showCupertinoModalBottomSheet(
                    expand: false,
                    context: context,
                    builder: (context) => MultiSelectorBottomSheet(
                          selectedKeywords: userProperty.keywords,
                          selectedHobbies: userProperty.hobbies,
                          onKeywordChanged: (newKeywords) {
                            setState(() {
                              _selectedKeywords = newKeywords;
                              userProperty.keywords = _selectedKeywords;
                            });
                          },
                          onHobbyChanged: (newHobbies) {
                            setState(() {
                              _selectedHobbies = newHobbies;
                              userProperty.hobbies = _selectedHobbies;
                            });
                          },
                        ));
              },
            ),
            titleWidget("취미"),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: infoMultiItemSelectable(userProperty.hobbies),
              ),
              onTap: () {
                showCupertinoModalBottomSheet(
                    expand: false,
                    context: context,
                    builder: (context) => MultiSelectorBottomSheet(
                          selectedKeywords: userProperty.keywords,
                          selectedHobbies: userProperty.hobbies,
                          onKeywordChanged: (newKeywords) {
                            setState(() {
                              _selectedKeywords = newKeywords;
                              userProperty.keywords = _selectedKeywords;
                            });
                          },
                          onHobbyChanged: (newHobbies) {
                            setState(() {
                              _selectedHobbies = newHobbies;
                              userProperty.hobbies = _selectedHobbies;
                            });
                          },
                        ));
              },
            ),
            // rangeSelector("", 130.0, 230.0, 130.0, 230.0),
            SizedBox(
              height: 32,
            ),
            CupertinoButton.filled(
              child: Text(
                "변경완료",
                style: HgtText.bodyLargeMedium(HgtColor.white),
              ),
              onPressed: () async {
                await http.updateProperty(user.studentId, userProperty);
              },
            ),
            // SizedBox(
            //   height: 16,
            // ),
            // CupertinoButton.filled(
            //   child: Text(
            //     "로그아웃",
            //     style: HgtText.large(HgtColor.white),
            //   ),
            //   onPressed: () async {
            //     ctrl.removeLoginData();
            //     Navigator.pushReplacement(context,
            //         CupertinoPageRoute(builder: ((context) => const Login())));
            //   },
            // ),
          ],
        ),
      ]),
    );
  }

  Widget titleWidget(title) {
    return Stack(
      children: [
        Container(
          color: HgtColor.bg,
          height: 40,
          width: double.infinity,
        ),
        Positioned(
          left: 24,
          bottom: 8,
          child: Text(
            title,
            textAlign: TextAlign.left,
            style: HgtText.bodyMediumRegular(HgtColor.black),
          ),
        ),
      ],
    );
  }

  Widget infoItem(title, text) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 16.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            alignment: Alignment.centerLeft,
            // decoration: HgtBox.test,
            width: 80,
            child: Text(
              title,
              style: HgtText.bodyLargeMedium(HgtColor.black),
            ),
          ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            child: Container(
              // decoration: HgtBox.test,
              alignment: Alignment.centerRight,
              child: Text(
                text,
                style: HgtText.bodyLargeMedium(HgtColor.grey),
                textAlign: TextAlign.right,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget infoItemSelectable(title, text) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: 12.0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            alignment: Alignment.centerLeft,
            // decoration: HgtBox.test,
            // width: 80,
            child: Text(
              title,
              style: HgtText.bodyLargeMedium(HgtColor.black),
            ),
          ),
          const SizedBox(
            width: 16,
          ),
          Expanded(
            child: Container(
              // decoration: HgtBox.test,
              alignment: Alignment.centerRight,
              child: Text(
                text,
                style: HgtText.bodyLargeMedium(HgtColor.grey),
                textAlign: TextAlign.right,
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 8.0),
            child: Icon(CupertinoIcons.chevron_forward),
          )
        ],
      ),
    );
  }

  Widget infoMultiItemSelectable(list) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Text(
              list == "null"
                  ? ""
                  : list.toString().substring(1, list.toString().length - 1),
              textAlign: TextAlign.right,
              style: HgtText.bodyLargeMedium(HgtColor.grey),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(left: 8.0),
            child: Icon(CupertinoIcons.chevron_forward),
          )
        ],
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
    // print(property);
    setState(() {
      userProperty = property;
      _selectedHeight = _heights.indexOf(int.parse(property.height));
      _selectedReligion = _religions.indexOf(property.religion);
      _selectedSmoke = _smokes.indexOf(property.smoke);
    });
  }

  Widget rangeSelector(title, minV, maxV, min, max) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      width: double.infinity,
      child: CupertinoRangeSlider(
        activeColor: HgtColor.primary,
        minValue: minV,
        maxValue: maxV,
        min: min,
        max: max,
        onMinChanged: (minVal) {
          setState(() {
            minV = minVal;
          });
        },
        onMaxChanged: (maxVal) {
          setState(() {
            maxV = maxVal;
          });
        },
      ),
    );
  }
}
