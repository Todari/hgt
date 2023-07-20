import 'package:flutter/cupertino.dart';
import 'package:hgt/components/multi_selector.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/const/text_style.dart';

class MultiSelectorBottomSheet extends StatefulWidget {
  const MultiSelectorBottomSheet(
      {required this.selectedKeywords,
      required this.selectedHobbies,
      required this.onKeywordChanged,
      required this.onHobbyChanged,
      super.key});
  final List<dynamic> selectedKeywords;
  final List<dynamic> selectedHobbies;
  final Function(List<dynamic>) onKeywordChanged;
  final Function(List<dynamic>) onHobbyChanged;

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

  @override
  void initState() {
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
              child: const Icon(CupertinoIcons.xmark),
              onTap: () {
                Navigator.pop(context);
              },
            ),
          ),
          const SizedBox(
            height: 24,
          ),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "키워드",
              style: HgtText.large(HgtColor.black),
              textAlign: TextAlign.left,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "자신을 나타내는 키워드를 2~5가지 선택해 주세요",
              style: HgtText.medium(HgtColor.grey),
              textAlign: TextAlign.left,
            ),
          ),
          Visibility(
            visible: _keywordVisibility,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              alignment: Alignment.centerLeft,
              child: Text(
                "키워드는 5개 까지만 선택할 수 있어요",
                style: HgtText.medium(HgtColor.secondary),
                textAlign: TextAlign.left,
              ),
            ),
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
          const SizedBox(
            height: 24,
          ),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "취미",
              style: HgtText.large(HgtColor.black),
              textAlign: TextAlign.left,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            alignment: Alignment.centerLeft,
            child: Text(
              "즐겨하는 취미활동을 2~5가지 선택해 주세요",
              style: HgtText.medium(HgtColor.grey),
              textAlign: TextAlign.left,
            ),
          ),
          Visibility(
            visible: _hobbyVisibility,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              alignment: Alignment.centerLeft,
              child: Text(
                "취미는 5개 까지만 선택할 수 있어요",
                style: HgtText.medium(HgtColor.secondary),
                textAlign: TextAlign.left,
              ),
            ),
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
          const SizedBox(
            height: 24,
          ),
          CupertinoButton.filled(
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
            child: const Text("선택 완료"),
          )
        ],
      ),
    );
  }
}
