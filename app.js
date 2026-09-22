const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
const port = 3000;

const JWT_SECRET = "0123456789";

const pool = mysql.createPool({
    host: "localhost",
    user: "eraldi",
    password: "1234",
    database: "mio_db",
    waitForConnections: true,
    queueLimit: 0,
});

// adding the authentication
function authenticateToken(req, res, next){
    const token = req.cookies.token;
    if (!token){ // if the user is not authenitcated we redirect him on the login page
        return res.redirect(302, "/public/login.html");
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.redirect(302, "/public/login.html");
    }
}

function redirectIfAuthenticated(req, res, next){
    const token = req.cookies.token;

    if (!token){
        return next();
    }
    try {
        jwt.verify(token, JWT_SECRET);

        return res.redirect("/private/profile.html");
    } catch (error) {
        res.clearCookie("token");
        return next();
    }
}

app.use('/JS', express.static(__dirname + "/JS"));
app.use('/style', express.static(__dirname + "/style"));
app.use('/imgs', express.static(__dirname + "/imgs"));
app.get("/public/login.html", redirectIfAuthenticated, (req,res) => {res.sendFile(__dirname + "/public/login.html")});
app.get("/public/signup.html", redirectIfAuthenticated, (req,res) => {res.sendFile(__dirname + "/public/signup.html")});
app.use('/public', express.static(__dirname + "/public"));
app.use('/private', authenticateToken, express.static(__dirname + "/private"));

app.get('/public/coach/html', async (req, res) => {
    res.sendFile(__dirname + '/public/coach.html');
    const coach_id = req.query.coach_id;
    console.log(req.query);
    const query = `SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
        coaches_categories.category_name
        ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
        ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id = ?
    GROUP BY
        coaches.id,
        coaches.name,
        coaches.last_name,
        coaches.sex
    ORDER BY coaches.id;`

    try {
        const row = await pool.promise().execute(query, [coach_id]);
        const coach = row[0];

        console.log(coach);
        res.json(coach);

    } catch (error) {
        console.log("Errore zio can: " + error);
    }
});

app.get("/GET/coach-info", async (req, res) =>{
    const coach_id = req.query.coach_id;
    const query = `SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.phone,
    coaches.email,
    coaches.sex,
    JSON_ARRAYAGG(
        coaches_categories.category_name
        ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
        ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id = ?
    GROUP BY
        coaches.id,
        coaches.name,
        coaches.last_name,
        coaches.sex
    ORDER BY coaches.id;`

    try {
        const row = await pool.promise().execute(query, [coach_id]);
        const coach = row[0];

        console.log(coach);
        res.json(coach);

    } catch (error) {
        console.log("Errore zio can: " + error);
    }
});

// login handling
app.post("/login", async (req, res) =>{
    const {username, password} = req.body;
    const query = "SELECT id, user_name FROM utenti3 WHERE user_name = ? AND password = ?";
    try {
        const [righe, colonne] = await pool.promise().execute(query, [username, password]);
        const user = righe[0];

        const payload = {
            userID: user.id,
            userName: user.user_name
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h"
        });

        res.cookie("token", token,{
            httpOnly: true,
            secure: true,
            maxAge: 3600000000,
            sameSite: "strict"
        });

        res.json({
            success: true,
            message: "Login riuscito!"
        });

    } catch (error) {
        console.log("Errore: "+ error); 
    }
});

app.post("/signup", async (req, res) =>{
    const {username, password, name, last_name, sex, birth_date} = req.body;
    const query = "INSERT INTO utenti3 (user_name, password, name, last_name, sex, birth_date) VALUES(?, ?, ?, ?, ?, ?)";
    try {
        const righe = await pool.promise().execute(query, [username, password, name, last_name, sex, birth_date]);
        const user = righe[0];

        const payload = {
            userID: user.InsertId,      // InsertId Is the Id (primary key) of the user that has been just added.
            userName: username
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h"
        });

        res.cookie("token", token,{
            httpOnly: true,
            secure: true,
            maxAge: 3600000,
            sameSite: "strict"
        });

        res.json({
            success: true,
            message: "Login riuscito!"
        });

    } catch (error) {
        console.log("Errore: "+ error); 
        res.json({
            success: false,
            message: "Nome utente già utilizzato."
        });
    }
});

app.get("/GET/profile", async(req, res) => {
    const token = req.cookies.token;

    if(!token){
        return res.redirect(302, "/public/index.html");
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);

        let id = payload.userID;
        const query = `SELECT user_name, name, last_name, birth_date, creation_date, sex
        FROM utenti3 WHERE 
        id = ?`;

        try {
            const righe = await pool.promise().execute(query, [id]);
            const user = righe[0];

            res.json(user);

        } catch (error2) {
            console.log(error2);
            return res.status(401).json({error: "Errore nel database, utente non trovato"});
        }
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Token non valido o scaduto"});
    }

});

app.get("/GET/coach-list", async (req, res) =>{
    const query = `SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
        coaches_categories.category_name
        ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
        ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id <= 6
    GROUP BY
        coaches.id,
        coaches.name,
        coaches.last_name,
        coaches.sex
    ORDER BY coaches.id;`
    try {
        const row = await pool.promise().execute(query);
        const coaches = row[0];

        console.log(coaches);
        res.json(coaches);
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Errore nel database"});
    }
});

app.get("/GET/disciplines", async (req, res) =>{
    const query = "SELECT * FROM categories";
    try {
        const row = await pool.promise().execute(query);
        const coaches = row[0];

        res.json(coaches);
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Errore nel database"});
    }
});

app.get("/GET/more-coaches", async (req, res) => {
    const query = req.query.discipline != "false"? ` SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
      coaches_categories.category_name
      ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
    ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id > ?
    AND EXISTS (
    SELECT 1
    FROM coaches_categories AS filter_category
    WHERE filter_category.id_coach = coaches.id
      AND filter_category.category_name = ?
    )
    GROUP BY
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex
    ORDER BY coaches.id
    LIMIT 6; `

    : `SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
        coaches_categories.category_name
        ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
        ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id > ?
    GROUP BY
        coaches.id,
        coaches.name,
        coaches.last_name,
        coaches.sex
    ORDER BY coaches.id
    LIMIT 6;`;
    let coach_id = req.query.coach_id;
    let discipline = req.query.discipline;
    try {
        const row = discipline != "false"? 
            await pool.promise().execute(query, [coach_id, discipline]) :
            await pool.promise().execute(query, [coach_id]);
        if (discipline){ console.log(discipline); }
        const coaches = row[0];
        console.log(coaches);

        res.json(coaches);

    } catch (error) {
        console.log("errore del DB: " + error);
        res.json(error);
    }
});

app.get("/GET/filtered-coach", async (req, res) => {
    let coach_id = req.query.coach_id;
    let discipline_name = req.query.discipline;
    let coach_name = req.query.coach_name;
    // the following line rapresents the two possibile queries we can perform. The user can select a name or not fot the coach. We have a ternary operator that checks if coach_name has been specified.
    const query = coach_name == '' ? `
    SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
      coaches_categories.category_name
      ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
    ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id > ?
    AND EXISTS (
    SELECT 1
    FROM coaches_categories AS filter_category
    WHERE filter_category.id_coach = coaches.id
      AND filter_category.category_name = ?
    )
    GROUP BY
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex
    ORDER BY coaches.id
    LIMIT 6; `
    : ` SELECT 
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    JSON_ARRAYAGG(
      coaches_categories.category_name
      ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
    ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id > ? AND coaches.name = ?
    AND EXISTS (
    SELECT 1
    FROM coaches_categories AS filter_category
    WHERE filter_category.id_coach = coaches.id
      AND filter_category.category_name = ?
    )
    GROUP BY
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex
    ORDER BY coaches.id
    LIMIT 6; `
    ;
    console.log(discipline_name);
    
    try {
        const row = coach_name == '' ?
            await pool.promise().execute(query, [1, discipline_name])
            :  await pool.promise().execute(query, [1,coach_name, discipline_name]);
        const coaches = row[0];
        console.log(coaches);

        res.json(coaches);
    } catch (error) {
        console.log("errore del DB: " + error);
        res.json(error);
    }
});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}/public/index.html`);
})
