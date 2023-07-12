package routes

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
)

func UserRouter(router_ *gin.Engine) {
	router_.POST("/user", controllers.CreateUser())
	router_.GET("/user", controllers.GetUsers())
	router_.GET("/user/:userId", controllers.GetUserById())
}
