package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")

		response := map[string]string{
			"message": "Привет из Go API!",
			"status":  "ok",
		}

		json.NewEncoder(w).Encode(response)
	})

	log.Println("Go API запущено на порту 3000")

	log.Fatal(http.ListenAndServe("0.0.0.0:3000", nil))
}
