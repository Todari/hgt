package services

import (
	"context"
	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var userCollection = configs.GetCollection(configs.DB, "users")

func InsertOneUser(ctx context.Context, user models.User) (*mongo.InsertOneResult, error) {
	newUser := models.User{
		Id:        user.Id,
		Session:   user.Session,
		Name:      user.Name,
		StudentId: user.StudentId,
		Major:     user.Major,
		Gender:    user.Gender,
		Age:       user.Age,
	}

	return userCollection.InsertOne(ctx, newUser)
}

func FindManyUsers(ctx context.Context) (*mongo.Cursor, error) {
	return userCollection.Find(ctx, bson.M{})
}

func FindOneUser(ctx context.Context, match bson.M) *mongo.SingleResult {
	return userCollection.FindOne(ctx, match)
}

func UpdateOneUser(ctx context.Context, match bson.M, update bson.M) (*mongo.UpdateResult, error) {
	return userCollection.UpdateOne(ctx, match, bson.D{{"$set", update}})
}
