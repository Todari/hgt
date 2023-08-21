package controllers

import (
	"context"
	"fmt"
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
		defer cancel()

		var userDto models.UserDto

		var age models.Property
		bindUserDtoErr := ctx_.BindJSON(&userDto)
		fmt.Println("bindUserDtoErr ====================================> ")
		fmt.Println(bindUserDtoErr)

		var user models.User
		user.Name = userDto.Name
		user.StudentId = userDto.StudentId
		user.Major = userDto.Major
		user.Gender = userDto.Gender == "남"
		user.Army = userDto.Army == "필"
		fmt.Println(user.Name)
		fmt.Println(user.StudentId)
		fmt.Println(user.Major)
		fmt.Println(user.Gender)
		fmt.Println(user.Army)

		findPropertyErr := services.FindOneProperty(ctx, models.Age, userDto.Age).Decode(&age)
		fmt.Println("findPropertyErr ====================================> ")
		fmt.Println(findPropertyErr)

		user.Age = age
		fmt.Println(user.Age)

		// use the validator library to validate required fields
		//if validationErr := validate.Struct(&user); validationErr != nil {
		//	fmt.Println("validationErr ====================================> ")
		//	fmt.Println(validationErr)
		//	ctx_.JSON(
		//		http.StatusBadRequest,
		//		structs.HttpResponse{
		//			Success: false,
		//			Data: map[string]interface{}{
		//				"data": validationErr.Error(),
		//			},
		//		},
		//	)
		//	return
		//}

		result, insertUserErr := services.InsertOneUser(ctx, user)

		if insertUserErr != nil {
			fmt.Println("insertUserErr ====================================> ")
			fmt.Println(insertUserErr)
			ctx_.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"data": insertUserErr.Error(),
					},
				},
			)
			return
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

		results, err := services.FindManyUsers(ctx)
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
