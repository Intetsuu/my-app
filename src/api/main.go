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

// DBDriver вЂ” СЃС‚СЂСѓРєС‚СѓСЂР° РґР»СЏ СЂР°Р±РѕС‚С‹ СЃ РїРёР»РѕС‚РѕРј РІ PostgreSQL.
type DBDriver struct {
	ID     int
	Name   string
	Team   string
	Number int
}

// DriverResponse вЂ” С„РѕСЂРјР°С‚ РїРёР»РѕС‚Р°, РєРѕС‚РѕСЂС‹Р№ РѕС‚РїСЂР°РІР»СЏРµРј РЅР° С„СЂРѕРЅС‚РµРЅРґ.
type DriverResponse struct {
	ID          int    `json:"id"`
	DriverNumber int   `json:"driver_number"`
	FullName    string `json:"full_name"`
	TeamName    string `json:"team_name"`
	TeamColour  string `json:"team_colour"`
	CountryCode string `json:"country_code"`
}

// DriverInput вЂ” РґР°РЅРЅС‹Рµ, РєРѕС‚РѕСЂС‹Рµ С„СЂРѕРЅС‚РµРЅРґ РѕС‚РїСЂР°РІР»СЏРµС‚ РїСЂРё СЃРѕР·РґР°РЅРёРё РёР»Рё РёР·РјРµРЅРµРЅРёРё РїРёР»РѕС‚Р°.
type DriverInput struct {
	FullName     string `json:"full_name"`
	TeamName     string `json:"team_name"`
	DriverNumber int    `json:"driver_number"`
}

// writeJSON РѕС‚РїСЂР°РІР»СЏРµС‚ JSON-РѕС‚РІРµС‚ СЃ СѓРєР°Р·Р°РЅРЅС‹Рј HTTP-СЃС‚Р°С‚СѓСЃРѕРј.
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё JSON: %v", err)
	}
}

// writeError РѕС‚РїСЂР°РІР»СЏРµС‚ РѕС€РёР±РєСѓ РІ С„РѕСЂРјР°С‚Рµ JSON.
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{
		"error": message,
	})
}

// decodeDriverInput С‡РёС‚Р°РµС‚ Рё РїСЂРѕРІРµСЂСЏРµС‚ РґР°РЅРЅС‹Рµ РїРёР»РѕС‚Р° РёР· JSON.
func decodeDriverInput(w http.ResponseWriter, r *http.Request) (DriverInput, error) {
	var input DriverInput

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	decoder := json.NewDecoder(r.Body)

	if err := decoder.Decode(&input); err != nil {
		return input, err
	}

	// РџСЂРѕРІРµСЂСЏРµРј, С‡С‚Рѕ РїРѕСЃР»Рµ РѕСЃРЅРѕРІРЅРѕРіРѕ JSON-РѕР±СЉРµРєС‚Р° РЅРµС‚ Р»РёС€РЅРёС… РґР°РЅРЅС‹С….
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		if err == nil {
			return input, errors.New("РІ Р·Р°РїСЂРѕСЃРµ РґРѕР»Р¶РЅРѕ Р±С‹С‚СЊ РѕРґРЅРѕ JSON-Р·РЅР°С‡РµРЅРёРµ")
		}

		return input, err
	}

	input.FullName = strings.TrimSpace(input.FullName)
	input.TeamName = strings.TrimSpace(input.TeamName)

	if input.FullName == "" {
		return input, errors.New("СѓРєР°Р¶РёС‚Рµ РёРјСЏ РїРёР»РѕС‚Р°")
	}

	if input.TeamName == "" {
		return input, errors.New("СѓРєР°Р¶РёС‚Рµ РєРѕРјР°РЅРґСѓ РїРёР»РѕС‚Р°")
	}

	if input.DriverNumber <= 0 {
		return input, errors.New("РЅРѕРјРµСЂ РїРёР»РѕС‚Р° РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ Р±РѕР»СЊС€Рµ РЅСѓР»СЏ")
	}

	return input, nil
}

// toDriverResponse РїСЂРµРѕР±СЂР°Р·СѓРµС‚ РґР°РЅРЅС‹Рµ РёР· Р±Р°Р·С‹ РІ С„РѕСЂРјР°С‚ API.
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

func main() {
	// РџРѕР»СѓС‡Р°РµРј РЅР°СЃС‚СЂРѕР№РєРё PostgreSQL РёР· РїРµСЂРµРјРµРЅРЅС‹С… РѕРєСЂСѓР¶РµРЅРёСЏ.
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

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє PostgreSQL: %v", err)
	}
	defer db.Close()

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// РџСЂРѕРІРµСЂСЏРµРј РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє Р±Р°Р·Рµ.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊСЃСЏ Рє PostgreSQL: %v", err)
	}

	log.Println("РЈСЃРїРµС€РЅРѕРµ РїРѕРґРєР»СЋС‡РµРЅРёРµ Рє PostgreSQL!")

	// РЎРѕР·РґР°С‘Рј С‚Р°Р±Р»РёС†Сѓ, РµСЃР»Рё РµС‘ РµС‰С‘ РЅРµС‚.
	// РЎСѓС‰РµСЃС‚РІСѓСЋС‰Р°СЏ С‚Р°Р±Р»РёС†Р° Рё РґР°РЅРЅС‹Рµ РїСЂРё СЌС‚РѕРј СЃРѕС…СЂР°РЅСЏСЋС‚СЃСЏ.
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS drivers (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			team TEXT NOT NULL,
			number INTEGER NOT NULL
		);
	`

	if _, err := db.Exec(createTableQuery); err != nil {
		log.Fatalf("РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ С‚Р°Р±Р»РёС†Сѓ drivers: %v", err)
	}

	// GET /hello вЂ” РїСЂРѕРІРµСЂРєР° СЂР°Р±РѕС‚С‹ API.
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.Header().Set("Allow", http.MethodGet)
			writeError(w, http.StatusMethodNotAllowed, "РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ")
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{
			"message": "Go API СЂР°Р±РѕС‚Р°РµС‚!",
		})
	})


http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        w.Header().Set("Allow", "GET")
        writeError(w, http.StatusMethodNotAllowed, "РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()

    if err := db.PingContext(ctx); err != nil {
        log.Printf("Healthcheck: PostgreSQL РЅРµРґРѕСЃС‚СѓРїРµРЅ: %v", err)
        writeError(w, http.StatusServiceUnavailable, "Database unavailable")
        return
    }

    writeJSON(w, http.StatusOK, map[string]string{
        "status":   "ok",
        "database": "ok",
    })
})


	// GET /drivers вЂ” РїРѕР»СѓС‡РёС‚СЊ РІСЃРµС… РїРёР»РѕС‚РѕРІ.
	// POST /drivers вЂ” СЃРѕР·РґР°С‚СЊ РїРёР»РѕС‚Р°.
	http.HandleFunc("/drivers", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {

		case http.MethodGet:
			rows, err := db.Query(`
				SELECT id, name, team, number
				FROM drivers
				ORDER BY id
			`)
			if err != nil {
				log.Printf("РћС€РёР±РєР° РїРѕР»СѓС‡РµРЅРёСЏ РїРёР»РѕС‚РѕРІ: %v", err)
				writeError(w, http.StatusInternalServerError, "РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РїРёР»РѕС‚РѕРІ")
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
					log.Printf("РћС€РёР±РєР° С‡С‚РµРЅРёСЏ РїРёР»РѕС‚Р°: %v", err)
					writeError(w, http.StatusInternalServerError, "РћС€РёР±РєР° С‡С‚РµРЅРёСЏ РґР°РЅРЅС‹С… РїРёР»РѕС‚Р°")
					return
				}

				drivers = append(drivers, toDriverResponse(driver))
			}

			if err := rows.Err(); err != nil {
				log.Printf("РћС€РёР±РєР° РїРµСЂРµР±РѕСЂР° РїРёР»РѕС‚РѕРІ: %v", err)
				writeError(w, http.StatusInternalServerError, "РћС€РёР±РєР° С‡С‚РµРЅРёСЏ СЃРїРёСЃРєР° РїРёР»РѕС‚РѕРІ")
				return
			}

			writeJSON(w, http.StatusOK, drivers)

		case http.MethodPost:
			input, err := decodeDriverInput(w, r)
			if err != nil {
				writeError(w, http.StatusBadRequest, "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ: "+err.Error())
				return
			}

			var driver DBDriver

			err = db.QueryRow(`
				INSERT INTO drivers (name, team, number)
				VALUES ($1, $2, $3)
				RETURNING id, name, team, number
			`,
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
				log.Printf("РћС€РёР±РєР° СЃРѕР·РґР°РЅРёСЏ РїРёР»РѕС‚Р°: %v", err)
				writeError(w, http.StatusInternalServerError, "РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕР·РґР°С‚СЊ РїРёР»РѕС‚Р°")
				return
			}

			writeJSON(w, http.StatusCreated, toDriverResponse(driver))

		default:
			w.Header().Set("Allow", "GET, POST")
			writeError(w, http.StatusMethodNotAllowed, "РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ")
		}
	})

	// PUT /drivers/{id} вЂ” РёР·РјРµРЅРёС‚СЊ РїРёР»РѕС‚Р°.
	// DELETE /drivers/{id} вЂ” СѓРґР°Р»РёС‚СЊ РїРёР»РѕС‚Р°.
	http.HandleFunc("/drivers/", func(w http.ResponseWriter, r *http.Request) {
		idString := strings.TrimPrefix(r.URL.Path, "/drivers/")
		idString = strings.TrimSuffix(idString, "/")

		id, err := strconv.Atoi(idString)
		if err != nil || id <= 0 {
			writeError(w, http.StatusBadRequest, "РЈРєР°Р¶РёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ ID РїРёР»РѕС‚Р°")
			return
		}

		switch r.Method {

		case http.MethodPut:
			input, err := decodeDriverInput(w, r)
			if err != nil {
				writeError(w, http.StatusBadRequest, "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ: "+err.Error())
				return
			}

			var driver DBDriver

			err = db.QueryRow(`
				UPDATE drivers
				SET name = $1, team = $2, number = $3
				WHERE id = $4
				RETURNING id, name, team, number
			`,
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
				writeError(w, http.StatusNotFound, "РџРёР»РѕС‚ РЅРµ РЅР°Р№РґРµРЅ")
				return
			}

			if err != nil {
				log.Printf("РћС€РёР±РєР° РёР·РјРµРЅРµРЅРёСЏ РїРёР»РѕС‚Р°: %v", err)
				writeError(w, http.StatusInternalServerError, "РќРµ СѓРґР°Р»РѕСЃСЊ РёР·РјРµРЅРёС‚СЊ РїРёР»РѕС‚Р°")
				return
			}

			writeJSON(w, http.StatusOK, toDriverResponse(driver))

		case http.MethodDelete:
			result, err := db.Exec(`
				DELETE FROM drivers
				WHERE id = $1
			`, id)

			if err != nil {
				log.Printf("РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ РїРёР»РѕС‚Р°: %v", err)
				writeError(w, http.StatusInternalServerError, "РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ РїРёР»РѕС‚Р°")
				return
			}

			affected, err := result.RowsAffected()
			if err != nil {
				log.Printf("РћС€РёР±РєР° РїСЂРѕРІРµСЂРєРё СѓРґР°Р»РµРЅРёСЏ: %v", err)
				writeError(w, http.StatusInternalServerError, "РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРІРµСЂРёС‚СЊ СѓРґР°Р»РµРЅРёРµ РїРёР»РѕС‚Р°")
				return
			}

			if affected == 0 {
				writeError(w, http.StatusNotFound, "РџРёР»РѕС‚ РЅРµ РЅР°Р№РґРµРЅ")
				return
			}

			w.WriteHeader(http.StatusNoContent)

		default:
			w.Header().Set("Allow", "PUT, DELETE")
			writeError(w, http.StatusMethodNotAllowed, "РњРµС‚РѕРґ РЅРµ РїРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ")
		}
	})

	// Р—Р°РїСѓСЃРєР°РµРј API.
	server := &http.Server{
		Addr:              "0.0.0.0:3000",
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Println("Go API Р·Р°РїСѓС‰РµРЅРѕ РЅР° РїРѕСЂС‚Сѓ 3000!")

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("РћС€РёР±РєР° Р·Р°РїСѓСЃРєР° СЃРµСЂРІРµСЂР°: %v", err)
	}
}
