package structs

type HttpResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
}

// {
// 		Status
// 		Data: {
// 			Success bool
// 			Data    {
// 					key: value
// 			}
// 		}
// }
