package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/Todari/go-mongo-crud/http"
	"github.com/Todari/go-mongo-crud/repository"
)

func main() {
	// create a database connection
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb+srv://todari:***REMOVED***@hgtcluster.cddfvpr.mongodb.net/"))
	if err != nil {
		log.Fatal(err)
	}
	if err := client.Connect(context.TODO()); err != nil {
		log.Fatal(err)
	}

	// create a repository
	repository := repository.NewRepository(client.Database("test"))

	// create an http server
	server := http.NewServer(repository)

	// create a gin router
	router := gin.Default()
	{
		router.GET("/user/:studentId", server.GetUser)
		router.POST("/user", server.CreateUser)
		router.PUT("/user/:studentId", server.UpdateUser)
		router.DELETE("/user/:studentId", server.DeleteUser)
	}

	// start the router
	router.Run(":80")
}
