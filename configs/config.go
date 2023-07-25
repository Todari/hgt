package configs

import (
	"context"
	"fmt"
	"go.mongodb.org/mongo-driver/mongo/options"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
)

func ConnectDB() *mongo.Client {
	//// Use the SetServerAPIOptions() method to set the Stable API version to 1
	//serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	//uri := EnvMongoURI()
	//opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)
	//
	//// Create a new client and connect to the server
	//client, err := mongo.Connect(context.TODO(), opts)
	//if err != nil {
	//	panic(err)
	//}
	//defer func() {
	//	if err = client.Disconnect(context.TODO()); err != nil {
	//		panic(err)
	//	}
	//}()
	//
	//// Send a ping to confirm a successful connection
	//var result bson.M
	//if err := client.Database("admin").RunCommand(context.TODO(), bson.D{{"ping", 1}}).Decode(&result); err != nil {
	//	panic(err)
	//}
	//fmt.Println("Pinged your deployment. You successfully connected to MongoDB!")
	//
	//return client

	uri := EnvMongoURI()
	if uri == "" {
		log.Fatal("MONGODB_URI not found")
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	//defer func() {
	//	if err := client.Disconnect(context.TODO()); err != nil {
	//		panic(err)
	//	}
	//}()

	fmt.Println("Connected to MongoDB")
	return client
}

// DB Client instance
var DB = ConnectDB()

// GetCollection getting database collections
func GetCollection(client_ *mongo.Client, collectionName_ string) *mongo.Collection {
	db := EnvDB()
	if db == "" {
		log.Fatal("DB_NAME not found")
	}

	collection := client_.Database(db).Collection(collectionName_)
	return collection
}
