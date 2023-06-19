package repository

import (
	"context"

	"github.com/Todari/hgt-server/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func (r repository) UpdateProperty(ctx context.Context, studentId string, property model.Property) (model.Property, error) {
	var result user
	err := r.db.Collection("hgtUser").FindOne(ctx, bson.M{"studentId": studentId}).Decode(&result)
	if err != nil {
		return model.Property{}, ErrUserNotFound
	}
	in := bson.M{}
	out, err := r.db.
		Collection("property").
		UpdateOne(ctx, bson.M{"userId": result.ID}, bson.M{"$set": in})
	if err != nil {
		return model.Property{}, err
	}
	if out.MatchedCount == 0 {
		return model.Property{}, ErrUserNotFound
	}
	return property, nil
}

type property struct {
	ID       primitive.ObjectID `bson:"_id,omitempty"`
	UserID   primitive.ObjectID `bson:"userId,omitempty"`
	Smoke    string             `bson:"smoke, omitempty"`
	Height   string             `bson:"height, omitempty"`
	Religion string             `bson:"religion, omitempty"`
	P        []string           `bson:"p,omitempty"`
}

func fromModelProperty(in model.Property) property {
	return property{
		// UserID:   in.UserID,
		Smoke:    in.Smoke,
		Height:   in.Height,
		Religion: in.Religion,
		P:        in.P,
	}
}

func toModelProperty(in property) model.Property {
	return model.Property{
		ID:       in.ID.String(),
		UserID:   in.UserID.String(),
		Smoke:    in.Smoke,
		Height:   in.Height,
		Religion: in.Religion,
		P:        in.P,
	}
}
