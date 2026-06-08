package token

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"github.com/Todari/hgt-server/configs"
	"github.com/Todari/hgt-server/services"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"strconv"
	"strings"
	"time"
)

//var CryptoKeys = cryptoKeyStruct{
//	cipherKey:   configs.CipherKey(),
//	cipherIvKey: configs.CipherIvKey(),
//}

// The CreateSession function create session token by hashing id using SHA-256
func CreateSession(idString string) string {
	milliSec := time.Now().UnixMilli()
	text := idString + "_" + strconv.Itoa(int(milliSec)) + configs.HashKey()
	hash := sha256.New()
	hash.Write([]byte(text))
	md := hash.Sum(nil)
	mdStr := hex.EncodeToString(md)
	return mdStr
}

// The CheckTokenValidation check token if valid
func CheckTokenValidation(ginCtx *gin.Context) error {
	session := ExtractToken(ginCtx)
	//text, decryptErr := CryptoKeys.Decrypt(token)
	//if decryptErr != nil {
	//	ginContext.JSON(
	//		http.StatusInternalServerError,
	//		structs.HttpResponse{
	//			Success: true,
	//			Data: map[string]interface{}{
	//				"message": "[Decrypt Error] => " + decryptErr.Error(),
	//			},
	//		},
	//	)
	//	return nil
	//}

	findOneUserResult := services.FindOneUser(ginCtx, bson.M{"session": session})
	if findOneUserResult.Err() != nil {
		return errors.New("")
	}

	return nil
}

// The ExtractToken get token from Authorization
func ExtractToken(c *gin.Context) string {
	bearerToken := c.Request.Header.Get("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}
	return ""
}

/*
 * Crypto func
 */
// The cryptoKeys struct
//type cryptoKeyStruct struct {
//	cipherKey   string
//	cipherIvKey string
//}

// The Encrypt function encrypt text by AES
//func (c cryptoKeyStruct) Encrypt(plainText string) (string, error) {
//	if strings.TrimSpace(plainText) == "" {
//		return plainText, nil
//	}
//
//	block, err := aes.NewCipher([]byte(c.cipherIvKey))
//	if err != nil {
//		return "", err
//	}
//
//	encrypter := cipher.NewCBCEncrypter(block, []byte(c.cipherIvKey))
//	paddedPlainText := padPKCS7([]byte(plainText), encrypter.BlockSize())
//
//	cipherText := make([]byte, len(paddedPlainText))
//
//	// CryptBlocks 함수에 데이터(paddedPlainText)와 암호화 될 데이터를 저장할 슬라이스(cipherText)를 넣으면 암호화가 된다.
//	encrypter.CryptBlocks(cipherText, paddedPlainText)
//
//	return base64.StdEncoding.EncodeToString(cipherText), nil
//}

// The Decrypt function decrypt text from crypto by AES
//func (c cryptoKeyStruct) Decrypt(cipherText string) (string, error) {
//	if strings.TrimSpace(cipherText) == "" {
//		return cipherText, nil
//	}
//
//	decodedCipherText, decodedCipherTextErr := base64.StdEncoding.DecodeString(cipherText)
//	if decodedCipherTextErr != nil {
//		fmt.Println("decodedCipherTextErr " + decodedCipherTextErr.Error())
//		return "", decodedCipherTextErr
//	}
//
//	block, blockErr := aes.NewCipher([]byte(c.cipherKey))
//	if blockErr != nil {
//		fmt.Println("blockErr " + blockErr.Error())
//		return "", blockErr
//	}
//
//	decrypter := cipher.NewCBCDecrypter(block, []byte(c.cipherIvKey))
//	plainText := make([]byte, len(decodedCipherText))
//
//	decrypter.CryptBlocks(plainText, decodedCipherText)
//	trimmedPlainText := trimPKCS5(plainText)
//
//	return string(trimmedPlainText), nil
//}

//func padPKCS7(plainText []byte, blockSize int) []byte {
//	padding := blockSize - len(plainText)%blockSize
//	padText := bytes.Repeat([]byte{byte(padding)}, padding)
//	return append(plainText, padText...)
//}

//func trimPKCS5(text []byte) []byte {
//	padding := text[len(text)-1]
//	return text[:len(text)-int(padding)]
//}
