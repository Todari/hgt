package repository

import (
	"context"

	"github.com/Todari/hgt-server/model"
)

type Repository interface {
	GetUser(ctx context.Context, studentId string) (model.User, error)
	CreateUser(ctx context.Context, in model.User) (model.User, error)
	UpdateUser(ctx context.Context, in model.User) (model.User, error)
	DeleteUser(ctx context.Context, studentId string) error
}
