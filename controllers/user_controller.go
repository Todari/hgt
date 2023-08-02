package controllers

import (
	"context"
	"github.com/Todari/hgt-server/services"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
	"net/http"
	"time"

	"github.com/Todari/hgt-server/models"
	"github.com/Todari/hgt-server/structs"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

var validate = validator.New()

func CreateUser() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		var user models.User
		defer cancel()

		// validate the request body
		user.Name = ctx_.Param("name")
		user.StudentId = ctx_.Param("location")
		user.Major = ctx_.Param("major")
		user.Gender = ctx_.Param("gender") == "남"
		user.Army = ctx_.Param("army") == "필"

		var age models.Property

		err := services.FindProperty(ctx, models.Age, ctx_.Param("age")).Decode(&age)
		user.Age = age

		if err := ctx_.BindJSON(&user); err != nil {
			ctx_.JSON(
				http.StatusBadRequest,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": err.Error(),
					},
				},
			)
			return
		}

		// use the validator library to validate required fields
		if validationErr := validate.Struct(&user); validationErr != nil {
			ctx_.JSON(
				http.StatusBadRequest,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": validationErr.Error(),
					},
				},
			)
		}

		result, err := services.CreateUser(ctx, user)

		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": err.Error(),
					},
				},
			)
		}

		ctx_.JSON(
			http.StatusCreated,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"data": result,
				},
			},
		)
	}
}

func GetUsers() gin.HandlerFunc {
	return func(ctx_ *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		var users []models.User
		defer cancel()

		results, err := services.FindUserList(ctx)
		if err != nil {
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": err.Error(),
					},
				},
			)
			return
		}

		defer func(results_ *mongo.Cursor, ctx_ context.Context) {
			err := results_.Close(ctx_)
			if err != nil {
				log.Fatal(err)
			}
		}(results, ctx)

		for results.Next(ctx) {
			var user models.User
			if err = results.Decode(&user); err != nil {
				ctx_.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"data": err.Error(),
						},
					},
				)
			}
			users = append(users, user)
		}

		ctx_.JSON(
			http.StatusOK,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"data": users,
				},
			},
		)
	}
}

//func GetUserById() gin.HandlerFunc {
//	return func(ctx_ *gin.Context) {
//		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//
//		// get userId from params
//		userId := ctx_.Param("userId")
//
//		var user models.User
//		defer cancel()
//
//		_id, objectIdErr := primitive.ObjectIDFromHex(userId)
//		if objectIdErr != nil {
//			ctx_.JSON(
//				http.StatusBadRequest,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"data": objectIdErr.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		err := userCollection.FindOne(ctx, bson.M{"_id": _id}).Decode(&user)
//		if err != nil {
//			ctx_.JSON(
//				http.StatusInternalServerError,
//				structs.HttpResponse{
//					Success: false,
//					Data: map[string]interface{}{
//						"data": err.Error(),
//					},
//				},
//			)
//			return
//		}
//
//		fmt.Println(user)
//		ctx_.JSON(
//			http.StatusOK,
//			structs.HttpResponse{
//				Success: true,
//				Data: map[string]interface{}{
//					"data": user,
//				},
//			},
//		)
//	}
//}
