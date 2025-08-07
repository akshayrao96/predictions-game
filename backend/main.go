package main

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Models
type User struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `gorm:"unique" json:"name"`
	Points int    `json:"points"`
}

type Team struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"unique" json:"name"`
}

type Prediction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"user_id"`
	User          User      `json:"user"`
	TeamID        uint      `json:"team_id"`	// For users dropdown
	{users.map((u) => (
	  <option key={u.id} value={u.id}>
		{u.name}
	  </option>
	))}
	
	// For leaderboard
	{standings.map((u) => (
	  <div key={u.id}>
		{u.name}: {u.points} pts
	  </div>
	))}
	
	// For predictions
	{predictions.map((p) => (
	  <div key={p.id}>
		<b>{p.user.name}</b>: <b>{p.team.name}</b> {p.scoreline} {p.opponent}
	  </div>
	))}
	
	// For history
	{history.map((h) => (
	  <div key={h.id}>
		GW{h.gameweek}: <b>{h.team.name}</b> {h.scoreline} {h.opponent}
	  </div>
	))}
	Team          Team      `json:"team"`
	Opponent      string    `json:"opponent"`
	Scoreline     string    `json:"scoreline"`
	Gameweek      int       `json:"gameweek"`
	SubmittedAt   time.Time `json:"submitted_at"`
	PointsEarned  int       `json:"points_earned"`
	ResultChecked bool      `json:"result_checked"`
}

func main() {
	db, err := gorm.Open(sqlite.Open("game.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to database")
	}
	DB = db

	db.AutoMigrate(&User{}, &Team{}, &Prediction{})

	seedUsers()
	seedTeams()

	app := fiber.New()
	app.Use(cors.New())

	// Routes
	app.Get("/users", getUsers)
	app.Get("/standings", getStandings)
	app.Get("/predictions/:gameweek", getPredictionsForGameweek)
	app.Post("/predict", submitPrediction)
	app.Get("/user/:id/history", getUserHistory)
	app.Get("/teams/:userID/available", getAvailableTeams)
	app.Post("/endgameweek/:gameweek", endGameweek)

	app.Listen(":3001")
}

func seedUsers() {
	users := []string{"Akshay", "Rohan", "Ashwin", "Mihir", "Hoe-Jin"}
	for _, name := range users {
		var u User
		DB.FirstOrCreate(&u, User{Name: name})
	}
}

func seedTeams() {
	teams := []string{
		"AFC Bournemouth",
		"Arsenal",
		"Aston Villa",
		"Brentford",
		"Brighton & Hove Albion",
		"Burnley",
		"Chelsea",
		"Crystal Palace",
		"Everton",
		"Fulham",
		"Leeds United",
		"Liverpool",
		"Manchester City",
		"Manchester United",
		"Newcastle United",
		"Nottingham Forest",
		"Sunderland",
		"Tottenham Hotspur",
		"West Ham United",
		"Wolverhampton Wanderers",
	}
	for _, name := range teams {
		var t Team
		DB.FirstOrCreate(&t, Team{Name: name})
	}
}

func getUsers(c *fiber.Ctx) error {
	var users []User
	DB.Find(&users)
	return c.JSON(users)
}

func getStandings(c *fiber.Ctx) error {
	var users []User
	DB.Order("points desc").Find(&users)
	return c.JSON(users)
}

func getPredictionsForGameweek(c *fiber.Ctx) error {
	gw := c.Params("gameweek")
	var preds []Prediction
	DB.Preload("User").Preload("Team").Where("gameweek = ?", gw).Order("user_id").Find(&preds)
	return c.JSON(preds)
}

func getUserHistory(c *fiber.Ctx) error {
	userID := c.Params("id")
	var preds []Prediction
	DB.Preload("Team").Where("user_id = ?", userID).Order("gameweek").Find(&preds)
	return c.JSON(preds)
}

func getAvailableTeams(c *fiber.Ctx) error {
	userID := c.Params("userID")
	var usedPreds []Prediction
	DB.Where("user_id = ?", userID).Find(&usedPreds)

	var usedTeamIDs []uint
	for _, p := range usedPreds {
		usedTeamIDs = append(usedTeamIDs, p.TeamID)
	}

	var teams []Team
	if len(usedTeamIDs) > 0 {
		DB.Where("id NOT IN ?", usedTeamIDs).Find(&teams)
	} else {
		DB.Find(&teams)
	}

	return c.JSON(teams)
}

func submitPrediction(c *fiber.Ctx) error {
    type PredictionInput struct {
        UserID    uint   `json:"user_id"`
        TeamID    uint   `json:"team_id"`
        Opponent  string `json:"opponent"`
        Scoreline string `json:"scoreline"`
        Gameweek  int    `json:"gameweek"`
    }
    var input PredictionInput
    if err := c.BodyParser(&input); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "invalid input"})
    }

    // Validate user exists
    var user User
    if err := DB.First(&user, input.UserID).Error; err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "invalid user"})
    }

    // Check if prediction already exists for this user and gameweek
    var existing Prediction
    DB.Where("user_id = ? AND gameweek = ?", input.UserID, input.Gameweek).First(&existing)
    if existing.ID != 0 {
        // Update the existing prediction
        existing.TeamID = input.TeamID
        existing.Opponent = input.Opponent
        existing.Scoreline = input.Scoreline
        existing.SubmittedAt = time.Now()
        DB.Save(&existing)
        return c.JSON(existing)
    }

    // Create new prediction
    pred := Prediction{
        UserID:      input.UserID,
        TeamID:      input.TeamID,
        Opponent:    input.Opponent,
        Scoreline:   input.Scoreline,
        Gameweek:    input.Gameweek,
        SubmittedAt: time.Now(),
    }
    DB.Create(&pred)
    return c.JSON(pred)
}

// POST /endgameweek/:gameweek
// Marks all predictions in a gameweek as checked (this is a manual step)
func endGameweek(c *fiber.Ctx) error {
	gwStr := c.Params("gameweek")
	gw, err := strconv.Atoi(gwStr)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid gameweek"})
	}

	var preds []Prediction
	DB.Where("gameweek = ?", gw).Find(&preds)
	for _, p := range preds {
		p.ResultChecked = true
		DB.Save(&p)
	}
	return c.JSON(fiber.Map{"message": "gameweek marked as completed"})
}
