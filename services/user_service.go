package services

import (
	"context"
	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var userCollection = configs.GetCollection(configs.DB, "users")

func InsertOneUser(ctx_ context.Context, user_ models.User) (*mongo.InsertOneResult, error) {
	newUser := models.User{
		Id:        user_.Id,
		Session:   user_.Session,
		Name:      user_.Name,
		StudentId: user_.StudentId,
		Major:     user_.Major,
		Gender:    user_.Gender,
		Age:       user_.Age,
	}

	return userCollection.InsertOne(ctx_, newUser)
}

func FindManyUsers(ctx_ context.Context) (*mongo.Cursor, error) {
	return userCollection.Find(ctx_, bson.M{})
}

func FindOneUser(ctx_ context.Context, match bson.M) *mongo.SingleResult {
	return userCollection.FindOne(ctx_, match)
}
