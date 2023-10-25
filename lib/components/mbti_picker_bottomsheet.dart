import 'package:flutter/cupertino.dart';
import 'package:hgt/const/text_style.dart';
import 'package:hgt/const/color_style.dart';
import 'package:hgt/const/box_style.dart';

class MbtiSelectBottomSheet extends StatefulWidget {
  const MbtiSelectBottomSheet({super.key});

  @override
  State<MbtiSelectBottomSheet> createState() => _MbtiSelectBottomSheetState();
}

class _MbtiSelectBottomSheetState extends State<MbtiSelectBottomSheet> {
  final List<String> _selectedMbti = ['', '', '', ''];

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[0] == 'E'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "E",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[0] = 'E';
                });
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[0] == 'I'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "I",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[0] = 'I';
                });
              },
            )
          ],
        ),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[1] == 'N'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "N",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[1] = 'N';
                });
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[1] == 'S'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "S",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[1] = 'S';
                });
              },
            )
          ],
        ),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[2] == 'T'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "T",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[2] = 'T';
                });
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[2] == 'F'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "F",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[2] = 'F';
                });
              },
            )
          ],
        ),
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[3] == 'P'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "P",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[3] = 'P';
                });
              },
            ),
            GestureDetector(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Container(
                  height: 64,
                  width: 48,
                  decoration: _selectedMbti[3] == 'J'
                      ? HgtBox.largeFilled(HgtColor.primary)
                      : HgtBox.largeBorder(HgtColor.primary),
                  child: Center(
                    child: Text(
                      "J",
                      style: HgtText.titleSmall(HgtColor.white),
                    ),
                  ),
                ),
              ),
              onTap: () {
                setState(() {
                  _selectedMbti[3] = 'J';
                });
              },
            )
          ],
        )
      ]),
    );
  }
}
