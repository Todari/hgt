package routes

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
)

func UserRouter(router *gin.RouterGroup) {
	router.POST("/user", controllers.CreateUser())
	router.GET("/user", controllers.GetUsers())
	router.GET("/user/:userId", controllers.GetUserById())
	router.PUT("/user", controllers.CreateUser())
}
