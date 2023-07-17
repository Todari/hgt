import 'package:flutter/cupertino.dart';
import 'package:flutter_multi_select_items/flutter_multi_select_items.dart';
import 'package:hgt/const/boxStyle.dart';
import 'package:hgt/const/colorStyle.dart';
import 'package:hgt/const/textStyle.dart';

class MultiSelector extends StatefulWidget {
  MultiSelector(
      {required this.list,
      required this.onSelectionChange,
      required this.initialSelectedList,
      required this.onErrorChange,
      Key? key})
      : super(key: key);
  final List<String> list;
  final List<dynamic> initialSelectedList;
  final Function(List<dynamic>) onSelectionChange;
  final Function(bool) onErrorChange;

  @override
  _MultiSelectorState createState() => _MultiSelectorState();
}

class _MultiSelectorState extends State<MultiSelector> {
  // late List<String> selectedList;
  late MultiSelectController _controller;

  @override
  void initState() {
    _controller = MultiSelectController();
    // selectedList = widget.initialSelectedList; // TODO: implement initState
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 16,
      ),
      width: double.infinity,
      // decoration: HgtBox.test,
      child: MultiSelectContainer(

          // isMaxSelectableWithPerpetualSelects: true,
          controller: _controller,
          itemsPadding: EdgeInsets.fromLTRB(8, 4, 8, 4),
          maxSelectableCount: 5,
          itemsDecoration: MultiSelectDecorations(
            decoration: HgtBox.chip,
            selectedDecoration: HgtBox.chipSelected,
          ),
          textStyles: MultiSelectTextStyles(
            textStyle: HgtText.medium(HgtColor.grey),
            selectedTextStyle: HgtText.medium(HgtColor.white),
          ),
          items: [
            for (var i in widget.list)
              MultiSelectCard(
                value: i,
                label: i,
                selected: widget.initialSelectedList.contains(i),
              ),
          ],
          onMaximumSelected: (selectedItems, selectedItem) {
            widget.onErrorChange(true);
          },
          onChange: (allSelectedItems, selectedItem) {
            widget.onSelectionChange(allSelectedItems);
            print("allSelectedItems : $allSelectedItems");
            print("selectedItem : $selectedItem");
            if (allSelectedItems.length != 5) {
              widget.onErrorChange(false);
            }
          }),
    );
  }
}
