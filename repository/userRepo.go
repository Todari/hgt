package repository

import (
	"context"
	"errors"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/Todari/hgt-server/model"
)

func (r repository) GetUser(ctx context.Context, studentId string) (model.User, error) {
	var out user
	err := r.db.
		Collection("hgtUser").
		FindOne(ctx, bson.M{"studentId": studentId}).
		Decode(&out)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return model.User{}, ErrUserNotFound
		}
		return model.User{}, err
	}
	return toModel(out), nil
}

func (r repository) CreateUser(ctx context.Context, user model.User) (model.User, error) {
	_, err := r.GetUser(ctx, user.StudentId)
	if err == nil {
		out, err := r.db.
			Collection("hgtUser").
			InsertOne(ctx, fromModel(user))
		if err != nil {
			return model.User{}, err
		}
		user.ID = out.InsertedID.(primitive.ObjectID).String()
		return user, nil
	} else {
		return user, err
	}
}

func (r repository) UpdateUser(ctx context.Context, user model.User) (model.User, error) {
	in := bson.M{}
	if user.Name != "" {
		in["name"] = user.Name
	}
	if user.Major != "" {
		in["major"] = user.Major
	}
	if user.Age != "" {
		in["age"] = user.Age
	}
	out, err := r.db.
		Collection("hgtUser").
		UpdateOne(ctx, bson.M{"studentId": user.StudentId}, bson.M{"$set": in})
	if err != nil {
		return model.User{}, err
	}
	if out.MatchedCount == 0 {
		return model.User{}, ErrUserNotFound
	}
	return user, nil
}

func (r repository) DeleteUser(ctx context.Context, studentId string) error {
	out, err := r.db.
		Collection("hgtUser").
		DeleteOne(ctx, bson.M{"studentId": studentId})
	if err != nil {
		return err
	}
	if out.DeletedCount == 0 {
		return ErrUserNotFound
	}
	return nil
}

type user struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Name      string             `bson:"name,omitempty"`
	StudentId string             `bson:"studentId,omitempty"`
	Major     string             `bson:"major,omitempty"`
	Age       string             `bson:"age,omitempty"`
	Gender    bool               `bson:"gender,omitempty"`
}

func fromModel(in model.User) user {
	return user{
		Name:      in.Name,
		StudentId: in.StudentId,
		Major:     in.Major,
		Age:       in.Age,
		Gender:    in.Gender,
	}
}

func toModel(in user) model.User {
	return model.User{
		ID:        in.ID.String(),
		Name:      in.Name,
		StudentId: in.StudentId,
		Major:     in.Major,
		Age:       in.Age,
		Gender:    in.Gender,
	}
}
