import 'package:flutter/cupertino.dart';
import 'package:hgt/components/multiSelector.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/colorStyle.dart';
import 'package:hgt/const/textStyle.dart';

class MultiSelectorBottomSheet extends StatefulWidget {
  MultiSelectorBottomSheet(
      {required this.selectedKeywords,
      required this.selectedHobbies,
      required this.onKeywordChanged,
      required this.onHobbyChanged,
      super.key});
  late List<dynamic> selectedKeywords;
  late List<dynamic> selectedHobbies;
  Function(List<dynamic>) onKeywordChanged;
  Function(List<dynamic>) onHobbyChanged;

  @override
  State<MultiSelectorBottomSheet> createState() =>
      _MultiSelectorBottomSheetState();
}

class _MultiSelectorBottomSheetState extends State<MultiSelectorBottomSheet> {
  List<String> keywords = [
    "열정적인",
    "지능캐",
    "핫바디",
    "너드미",
    "과탑",
    "인싸",
    "존잘존예",
    "훈남훈녀",
    "취미부자"
  ];
  List<String> hobbies = [
    "여행",
    "맛집탐방",
    "보드게임",
    "게임",
    "방탈출",
    "카페투어",
    "클라이밍",
    "헬스",
    "수영",
    "필라테스",
    "테니스",
    "배드민턴",
    "스포츠관람",
    "사진",
    "릴스/쇼츠",
    "OTT",
    "악기연주",
    "그림",
    "전시회",
  ];
  late List<dynamic> selectingKeyword;
  late List<dynamic> selectingHobby;

  late bool _keywordVisibility = false;
  late bool _hobbyVisibility = false;
  late bool _buttonActivated = false;

  @override
  void initState() {
    // TODO: implement initState
    selectingKeyword = widget.selectedKeywords;
    selectingHobby = widget.selectedHobbies;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        children: [
          Container(
            alignment: Alignment.centerLeft,
            child: GestureDetector(
              child: Icon(CupertinoIcons.xmark),
              onTap: () {
                Navigator.pop(context);
              },
            ),
          ),
          SizedBox(
            height: 24,
          ),
          Container(
            padding: EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "키워드",
              style: HgtText.large(HgtColor.black),
              textAlign: TextAlign.left,
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "자신을 나타내는 키워드를 2~5가지 선택해 주세요",
              style: HgtText.medium(HgtColor.grey),
              textAlign: TextAlign.left,
            ),
          ),
          Visibility(
            child: Container(
              padding: EdgeInsets.symmetric(vertical: 8),
              alignment: Alignment.centerLeft,
              child: Text(
                "키워드는 5개 까지만 선택할 수 있어요",
                style: HgtText.medium(HgtColor.secondary),
                textAlign: TextAlign.left,
              ),
            ),
            visible: _keywordVisibility,
          ),
          MultiSelector(
            list: keywords,
            initialSelectedList: widget.selectedKeywords,
            onErrorChange: (visibility) {
              setState(() {
                _keywordVisibility = visibility;
              });
            },
            onSelectionChange: (newKeywords) {
              setState(() {
                selectingKeyword = newKeywords;
                // widget.onKeywordChanged(selectingKeyword);
              });
            },
          ),
          SizedBox(
            height: 24,
          ),
          Container(
            padding: EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "취미",
              style: HgtText.large(HgtColor.black),
              textAlign: TextAlign.left,
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "즐겨하는 취미활동을 2~5가지 선택해 주세요",
              style: HgtText.medium(HgtColor.grey),
              textAlign: TextAlign.left,
            ),
          ),
          Visibility(
            child: Container(
              padding: EdgeInsets.symmetric(vertical: 8),
              alignment: Alignment.centerLeft,
              child: Text(
                "취미는 5개 까지만 선택할 수 있어요",
                style: HgtText.medium(HgtColor.secondary),
                textAlign: TextAlign.left,
              ),
            ),
            visible: _hobbyVisibility,
          ),
          MultiSelector(
            list: hobbies,
            initialSelectedList: widget.selectedHobbies,
            onErrorChange: (visibility) {
              setState(() {
                _hobbyVisibility = visibility;
              });
            },
            onSelectionChange: (newHobbies) {
              setState(() {
                selectingHobby = newHobbies;
                // widget.onHobbyChanged(selectingHobby);
                print("hobbyvisibility : $_hobbyVisibility");
              });
            },
          ),
          SizedBox(
            height: 24,
          ),
          CupertinoButton.filled(
            child: Text("선택 완료"),
            onPressed:
                (selectingHobby.length >= 2 && selectingKeyword.length >= 2)
                    ? () {
                        setState(() {
                          widget.onKeywordChanged(selectingKeyword);
                          widget.onHobbyChanged(selectingHobby);
                        });

                        Navigator.pop(context);
                      }
                    : null,
          )
        ],
      ),
    );
  }
}
