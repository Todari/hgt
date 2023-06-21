class Property {
  String height;
  String smoke;
  String religion;
  dynamic p;

  Property(this.height, this.smoke, this.religion, this.p);

  Property.fromJson(Map<dynamic, dynamic> json)
      : height = json["height"]!,
        smoke = json["smoke"]!,
        religion = json["religion"]!,
        p = json["p"]!;
  Map<String, dynamic> toJson() =>
      {"height": height, "smoke": smoke, "religion": religion, "p": p};

  @override
  String toString() => '$height, $smoke, $religion, $p';
}

// List<Properties> P = [
//   Properties(0, "핫바디"),
//   Properties(1, "지적인"),
//   Properties(2, "열정적인"),
//   Properties(3, "유머러스한"),
//   Properties(4, "긍정적인"),
//   Properties(5, "존잘존예"),
//   Properties(6, "훈남훈녀"),
//   Properties(7, "패션왕"),
//   Properties(8, "일잘러"),
//   Properties(9, "과탑"),
//   Properties(10, "인싸"),
//   Properties(11, "너드"),
// ];
