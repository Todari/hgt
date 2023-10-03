package configs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func EnvMongoURI() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(".env file not found")
	}
	return os.Getenv("MONGODB_URI")
}

func EnvDB() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(".env file not found")
	}
	return os.Getenv("DB_NAME")
}

func HashKey() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(".env file not found")
	}
	return os.Getenv("HASH_KEY")
}

func CipherKey() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(".env file not found")
	}
	return os.Getenv("CIPHER_KEY")
}

func CipherIvKey() string {
	err := godotenv.Load()
	if err != nil {
		log.Fatal(".env file not found")
	}
	return os.Getenv("CIPHER_IV_KEY")
}
