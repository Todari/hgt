class HgtUser {
  String name;
  String studentId;
  String major;
  String age;

  HgtUser(this.name, this.studentId, this.major, this.age);
  @override
  String toString() => '$name , $studentId, $major, $age';
}
