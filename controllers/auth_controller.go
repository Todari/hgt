package controllers

import (
	"context"
	"fmt"
	"github.com/Todari/hgt-server/models"
	"github.com/Todari/hgt-server/services"
	"github.com/Todari/hgt-server/structs"
	"github.com/Todari/hgt-server/utils/token"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
	"strconv"
	"time"
)

func SignIn() gin.HandlerFunc {
	return func(ginCtx *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		var userDto models.CreateUserDto

		bindUserDtoErr := ginCtx.BindJSON(&userDto)
		if bindUserDtoErr != nil {
			ginCtx.JSON(
				http.StatusInternalServerError,
				structs.HttpResponse{
					Success: false,
					Data: map[string]interface{}{
						"message": "[Bind UserDto Error] => " + bindUserDtoErr.Error(),
					},
				},
			)
			return
		}

		var user models.User
		findUserResult := services.FindOneUser(ctx, bson.M{"student_id": userDto.StudentId})

		// if user not exist
		if findUserResult == nil {
			// new Id
			id := primitive.NewObjectID()

			// age
			ageInt, strToIntErr := strconv.Atoi(userDto.Age)
			if strToIntErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Convert String to Int Error] => " + strToIntErr.Error(),
						},
					},
				)
				return
			}

			// user
			user.Id = id
			user.Name = userDto.Name
			user.StudentId = userDto.StudentId
			user.Major = userDto.Major
			user.Age = ageInt
			user.Gender = userDto.Gender == "남"
			user.Army = userDto.Army == "필"
			user.Session = token.CreateSession(id.Hex())

			_, createUserErr := services.InsertOneUser(ctx, user)

			if createUserErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Insert User Error] => " + createUserErr.Error(),
						},
					},
				)
				return
			}
		} else {
			//	if user exist
			bindUserErr := findUserResult.Decode(&user)
			if bindUserErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Bind User Error] => " + bindUserErr.Error(),
						},
					},
				)
				return
			}

			// add session
			user.Session = token.CreateSession(user.Id.Hex())

			_, updateUserErr := services.UpdateOneUser(ctx, bson.M{"_id": user.Id}, user)
			if updateUserErr != nil {
				ginCtx.JSON(
					http.StatusInternalServerError,
					structs.HttpResponse{
						Success: false,
						Data: map[string]interface{}{
							"message": "[Update User Error] => " + updateUserErr.Error(),
						},
					},
				)
				return
			}
		}
		fmt.Println("user ====================================> start ")
		fmt.Println(user)
		fmt.Println("user ====================================> end ")
		ginCtx.JSON(
			http.StatusInternalServerError,
			structs.HttpResponse{
				Success: true,
				Data: map[string]interface{}{
					"message": user,
				},
			},
		)
	}
}

func SignOut(ctx *gin.Context) {

}
