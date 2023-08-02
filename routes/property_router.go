package routes

import (
	"github.com/Todari/hgt-server/controllers"
	"github.com/gin-gonic/gin"
)

func PropertyRouter(router_ *gin.Engine) {
	router_.POST("/property", controllers.CreateProperty())
	router_.GET("/property", controllers.GetProperties())
	router_.GET("/property/:type", controllers.GetProperty())
}
