package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// DBDriver описывает пилота в базе данных.
type DBDriver struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Team   string `json:"team"`
	Number int    `json:"number"`
}

// DriverResponse описывает пилота в ответе API.
type DriverResponse struct {
	ID           int    `json:"id"`
	DriverNumber int    `json:"driver_number"`
	FullName     string `json:"full_name"`
	TeamName     string `json:"team_name"`
	TeamColour   string `json:"team_colour"`
	CountryCode  string `json:"country_code"`
}

// DriverInput описывает данные для создания и изменения пилота.
type DriverInput struct {
	FullName     string `json:"full_name"`
	TeamName     string `json:"team_name"`
	DriverNumber int    `json:"driver_number"`
}

var db *sql.DB

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Ошибка отправки JSON: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{
		"error": message,
	})
}

func decodeDriverInput(r *http.Request) (DriverInput, error) {
	var input DriverInput

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&input); err != nil {
		return input, err
	}

	// Проверяем, что после объекта нет лишних данных.
	var extra any
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		return input, errors.New("в запросе обнаружены лишние данные")
	}

	input.FullName = strings.TrimSpace(input.FullName)
	input.TeamName = strings.TrimSpace(input.TeamName)

	if input.FullName == "" {
		return input, errors.New("имя пилота не может быть пустым")
	}

	if input.TeamName == "" {
		return input, errors.New("название команды не может быть пустым")
	}

	if input.DriverNumber < 1 || input.DriverNumber > 99 {
		return input, errors.New("номер пилота должен быть от 1 до 99")
	}

	return input, nil
}

func toDriverResponse(driver DBDriver) DriverResponse {
	return DriverResponse{
		ID:           driver.ID,
		DriverNumber: driver.Number,
		FullName:     driver.Name,
		TeamName:     driver.Team,
		TeamColour:   "",
		CountryCode:  "",
	}
}

func scanDriver(row *sql.Row) (DBDriver, error) {
	var driver DBDriver

	err := row.Scan(
		&driver.ID,
		&driver.Name,
		&driver.Team,
		&driver.Number,
	)

	return driver, err
}

func driversHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getDrivers(w, r)
	case http.MethodPost:
		createDriver(w, r)
	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
	}
}

func getDrivers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.QueryContext(
		r.Context(),
		`SELECT id, name, team, number FROM drivers ORDER BY id`,
	)
	if err != nil {
		log.Printf("Ошибка получения пилотов: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось получить пилотов")
		return
	}
	defer rows.Close()

	drivers := make([]DriverResponse, 0)

	for rows.Next() {
		var driver DBDriver

		if err := rows.Scan(
			&driver.ID,
			&driver.Name,
			&driver.Team,
			&driver.Number,
		); err != nil {
			log.Printf("Ошибка чтения пилота: %v", err)
			writeError(w, http.StatusInternalServerError, "Ошибка чтения данных пилота")
			return
		}

		drivers = append(drivers, toDriverResponse(driver))
	}

	if err := rows.Err(); err != nil {
		log.Printf("Ошибка обработки списка пилотов: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось прочитать пилотов")
		return
	}

	writeJSON(w, http.StatusOK, drivers)
}

func createDriver(w http.ResponseWriter, r *http.Request) {
	input, err := decodeDriverInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var driver DBDriver

	err = db.QueryRowContext(
		r.Context(),
		`INSERT INTO drivers (name, team, number)
		 VALUES ($1, $2, $3)
		 RETURNING id, name, team, number`,
		input.FullName,
		input.TeamName,
		input.DriverNumber,
	).Scan(
		&driver.ID,
		&driver.Name,
		&driver.Team,
		&driver.Number,
	)

	if err != nil {
		log.Printf("Ошибка создания пилота: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось создать пилота")
		return
	}

	writeJSON(w, http.StatusCreated, toDriverResponse(driver))
}

func driverByIDHandler(w http.ResponseWriter, r *http.Request) {
	idText := strings.TrimPrefix(r.URL.Path, "/drivers/")

	if idText == "" || strings.Contains(idText, "/") {
		writeError(w, http.StatusBadRequest, "Некорректный ID пилота")
		return
	}

	id, err := strconv.Atoi(idText)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "Некорректный ID пилота")
		return
	}

	switch r.Method {
	case http.MethodPut:
		updateDriver(w, r, id)
	case http.MethodDelete:
		deleteDriver(w, r, id)
	default:
		w.Header().Set("Allow", "PUT, DELETE")
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
	}
}

func updateDriver(w http.ResponseWriter, r *http.Request, id int) {
	input, err := decodeDriverInput(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	var driver DBDriver

	err = db.QueryRowContext(
		r.Context(),
		`UPDATE drivers
		 SET name = $1, team = $2, number = $3
		 WHERE id = $4
		 RETURNING id, name, team, number`,
		input.FullName,
		input.TeamName,
		input.DriverNumber,
		id,
	).Scan(
		&driver.ID,
		&driver.Name,
		&driver.Team,
		&driver.Number,
	)

	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "Пилот не найден")
		return
	}

	if err != nil {
		log.Printf("Ошибка обновления пилота: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось обновить пилота")
		return
	}

	writeJSON(w, http.StatusOK, toDriverResponse(driver))
}

func deleteDriver(w http.ResponseWriter, r *http.Request, id int) {
	result, err := db.ExecContext(
		r.Context(),
		`DELETE FROM drivers WHERE id = $1`,
		id,
	)
	if err != nil {
		log.Printf("Ошибка удаления пилота: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось удалить пилота")
		return
	}

	affected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Ошибка проверки удаления пилота: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось проверить удаление пилота")
		return
	}

	if affected == 0 {
		writeError(w, http.StatusNotFound, "Пилот не найден")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Printf("Проверка базы данных не пройдена: %v", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status":   "error",
			"database": "unavailable",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status":   "ok",
		"database": "ok",
	})
}

func main() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}
	if dbUser == "" {
		dbUser = "app"
	}
	if dbName == "" {
		dbName = "f1db"
	}

	dsn := "host=" + dbHost +
		" port=" + dbPort +
		" user=" + dbUser +
		" password=" + dbPassword +
		" dbname=" + dbName +
		" sslmode=disable"

	var err error

	db, err = sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Не удалось открыть подключение к PostgreSQL: %v", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Не удалось подключиться к PostgreSQL: %v", err)
	}

	log.Println("Успешное подключение к PostgreSQL!")

	// Создаём таблицу только в том случае, если её ещё нет.
	// Существующие записи не удаляются.
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS drivers (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			team TEXT NOT NULL,
			number INTEGER NOT NULL
		)
	`)
	if err != nil {
		log.Fatalf("Не удалось проверить таблицу drivers: %v", err)
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/drivers", driversHandler)
	mux.HandleFunc("/drivers/", driverByIDHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	server := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("Go API запущено на порту %s", port)

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("Ошибка запуска Go API: %v", err)
	}
}
