package structs

type HttpResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}
