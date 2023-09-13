package routes

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
)

func AuthRouter(router *gin.Engine) {
	router.POST("/signin", controllers.SignIn())
}
