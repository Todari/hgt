package configs

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectDB() *mongo.Client {
	uri := EnvMongoURI()
	if uri == "" {
		log.Fatal("MONGODB_URI not found")
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	// defer func() {
	// 	if err := client.Disconnect(context.TODO()); err != nil {
	// 		panic(err)
	// 	}
	// }()

	fmt.Println("Connected to MongoDB")
	return client
}

// Client instance
var DB *mongo.Client = ConnectDB()

// getting database collections
func GetCollection(client_ *mongo.Client, collectionName_ string) *mongo.Collection {
	db := EnvDB()
	if db == "" {
		log.Fatal("DB_NAME not found")
	}

	collection := client_.Database(db).Collection(collectionName_)
	return collection
}
