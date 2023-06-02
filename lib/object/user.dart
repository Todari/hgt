class HgtUser {
  String name;
  String studentId;
  String major;
  int age;

  HgtUser(this.name, this.studentId, this.major, this.age);
  @override
  String toString() => '$name , $studentId, $major, $age';
}
