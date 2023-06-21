package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Todari/hgt-server/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func (r repository) GetChatroom(ctx context.Context, studentId string) (model.Chatroom, error) {
	var user user
	err := r.db.Collection("hgtUser").FindOne(ctx, bson.M{"studentId": studentId}).Decode(&user)
	if err != nil {
		return model.Chatroom{}, ErrUserNotFound
	}
	var out chatroom
	err2 := r.db.
		Collection("chatroom").
		FindOne(ctx, bson.M{"users": user.ID}).
		Decode(&out)
	if err2 != nil {
		if errors.Is(err2, mongo.ErrNoDocuments) {
			return model.Chatroom{}, ErrChatroomNotFound
		}
		return model.Chatroom{}, err2
	}
	return toModelChatroom(out), nil
}

func (r repository) GetChatsInChatroom(ctx context.Context, chatroom model.Chatroom) ([]model.Chat, error) {
	var results []model.Chat
	var result chat
	chatroomId, err := primitive.ObjectIDFromHex(strings.Split(chatroom.ID, "\"")[1])
	if err != nil {
		return []model.Chat{}, err
	}
	cursor, err := r.db.Collection("chat").Find(ctx, bson.M{"chatroomId": chatroomId})
	if err != nil {
		return []model.Chat{}, ErrChatroomNotFound
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		if err := cursor.Decode(&result); err != nil {
			return []model.Chat{}, err
		}
		fmt.Println("result : ", result)
		if err != nil {
			return []model.Chat{}, err
		}
		results = append(results, toModelChat(result))
	}
	if err := cursor.Err(); err != nil {
		return []model.Chat{}, err
	}
	fmt.Println(results)
	return results, nil
}

func (r repository) SendChatInChatroom(ctx context.Context, chat model.Chat) (model.Chat, error) {
	out, err := r.db.Collection("chat").InsertOne(ctx, fromModelChat(chat))
	if err != nil {
		return model.Chat{}, err
	}
	chat.ID = out.InsertedID.(primitive.ObjectID).String()
	chat.CreatedAt = time.Now().GoString()
	return chat, nil
}

type chatroom struct {
	ID    primitive.ObjectID   `bson:"_id,omitempty"`
	Users []primitive.ObjectID `bson:"users,omitempty"`
}

func fromModelChatroom(in model.Chatroom) chatroom {

	var objectIDs []primitive.ObjectID
	for _, strID := range in.Users {
		objID, _ := primitive.ObjectIDFromHex(strID)
		objectIDs = append(objectIDs, objID)
	}
	return chatroom{
		Users: objectIDs,
	}
}

func toModelChatroom(in chatroom) model.Chatroom {
	var stringIDS []string
	for _, objID := range in.Users {
		stringIDS = append(stringIDS, objID.String())
	}
	return model.Chatroom{
		ID:    in.ID.String(),
		Users: stringIDS,
	}
}

type chat struct {
	ID         primitive.ObjectID `bson:"_id,omitempty"`
	ChatroomID primitive.ObjectID `bson:"chatroomId,omitempty"`
	CreatedAt  string             `bson:"createdAt,omitempty"`
	Sender     primitive.ObjectID `bson:"sender,omitempty"`
	Content    string             `bson:"content,omitempty"`
}

func fromModelChat(in model.Chat) chat {
	ChatroomID, err := primitive.ObjectIDFromHex(strings.Split(in.ChatroomID, "\"")[1])
	if err != nil {
		fmt.Println(err)
	}
	Sender, err := primitive.ObjectIDFromHex(strings.Split(in.Sender, "\"")[1])
	if err != nil {
		fmt.Println(err)
	}
	// fmt.Println(UserID)
	return chat{
		ChatroomID: ChatroomID,
		CreatedAt:  in.CreatedAt,
		Sender:     Sender,
		Content:    in.Content,
	}
}

func toModelChat(in chat) model.Chat {
	return model.Chat{
		ID:         in.ID.String(),
		ChatroomID: in.ChatroomID.String(),
		CreatedAt:  in.CreatedAt,
		Sender:     in.Sender.String(),
		Content:    in.Content,
	}
}
