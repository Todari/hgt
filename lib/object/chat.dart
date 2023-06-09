class Chatroom {
  List<String> users;

  Chatroom(this.users);

  Chatroom.fromJson(Map<String, List<String>> json) : users = json["users"]!;
  Map<String, List<String>> toJson() => {"users": users};
}

class Chat {
  String chatroomId;
  String createdAt;
  String sender;
  String content;

  Chat(this.chatroomId, this.createdAt, this.sender, this.content);

  Chat.fromJson(Map<String, String> json)
      : chatroomId = json["chatroomId"]!,
        createdAt = json["createdAt"]!,
        sender = json["sender"]!,
        content = json["content"]!;
  Map<String, String> toJson() => {
        "chatroomId": chatroomId,
        "createdAt": createdAt,
        "sender": sender,
        "content": content
      };

  @override
  String toString() => '$chatroomId, $createdAt, $sender, $content';
}
