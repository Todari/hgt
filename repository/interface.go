package repository

import (
	"context"

	"github.com/Todari/hgt-server/model"
)

type Repository interface {
	GetUser(ctx context.Context, studentId string) (model.User, error)
	CreateUser(ctx context.Context, in model.User, property model.Property) (model.User, model.Property, error)
	UpdateUser(ctx context.Context, in model.User) (model.User, error)
	DeleteUser(ctx context.Context, studentId string) error

	UpdateProperty(ctx context.Context, studentId string, in model.Property) (model.Property, error)

	GetChatroom(ctx context.Context, studentId string) (model.Chatroom, error)
	GetChatsInChatroom(ctx context.Context, chatroom model.Chatroom) ([]model.Chat, error)
	SendChatInChatroom(ctx context.Context, chat model.Chat) (model.Chat, error)
}
