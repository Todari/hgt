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
