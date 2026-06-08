package main

import (
	"github.com/Todari/hgt-server/middlewares"
	"net/http"

	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	router := gin.Default()

	// Connect Database
	configs.ConnectDB()

	// Hello, World!
	router.GET("/", func(ctx_ *gin.Context) {
		ctx_.String(http.StatusOK, "Hello, World!")
	})

	public := router.Group("/")
	routes.AuthRouter(public)

	protected := router.Group("/")
	protected.Use(middlewares.AuthMiddleware())
	routes.UserRouter(protected)
	routes.PropertyRouter(protected)

	err := router.Run("localhost:8080")

	if err != nil {
		return
	}
}
