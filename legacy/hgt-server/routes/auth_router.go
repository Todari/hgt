package routes

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
)

func AuthRouter(router *gin.RouterGroup) {
	router.POST("/signin", controllers.SignIn())
}
