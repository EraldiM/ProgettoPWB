const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
const port = 3000;

const JWT_SECRET = "0123456789";

// connecting to the DB
const pool = mysql.createPool({
    host: "localhost",
    user: "eraldi",
    password: "1234",
    database: "mio_db",
    waitForConnections: true,
    queueLimit: 0,
});
// adding the authentication
// This function provides an authenitcation method checking the token (if present) provided by the client 
// and if the Token if invalid we redirect him on the login page.
// The redirect can only be performed on action like, trying to visit profile page while not authenticated.
function authenticateToken(req, res, next){
    const token = req.cookies.token;
    if (!token){ // if the user is not authenitcated we redirect him on the login page
        return res.redirect(302, "/public/new_login.html");
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.redirect(302, "/public/new_login.html");
    }
}

// function authenticateToken(req, res, next){
//     const token = req.cookies.token;
//     if (!token){ // if the user is not authenitcated we redirect him on the login page
//         return res.status(401).json({
//             error: "Utente non autenticato"
//         })
//     }
//     try {
//         const payload = jwt.verify(token, JWT_SECRET);
//         req.user = payload;
//         next();
//     } catch (error) {
//         return res.status(401).json({
//             error: "Token non valido o scaduto"
//         });
//     }
// }


// This function checks user's token to see if he is logged, if the token is valid
// while perfroming certain action like tring to visit login or sing in page we redirect him on his profile page.
function redirectIfAuthenticated(req, res, next){
    const token = req.cookies.token;

    if (!token){
        return next();
    }
    try {
        jwt.verify(token, JWT_SECRET);

        return res.redirect("/private/new_profile.html");
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


// ************************************
//
// This section covers global routes
//
// ************************************

app.get("/api/me", (req, res)=>{
    const token = req.cookies.token;

    if (!token){
        return res.json({authenticated: false});
    }

    try {
        const user = jwt.verify(token, JWT_SECRET);
        // console.log(user);
        return res.json({authenticated: true});
    } catch (error) {
        return res.json({authenticated: false});
    }
});

app.post("/api/logout", (req, res) =>{
    res.clearCookie("token");
    res.json({
        success: true,
        message: "Logout effettuato"
    });
});

// ************************************
//
// This section covers index.html routes
//
// ************************************

app.get("/api/region-coaches", async (req, res) =>{
    const region = req.query.region;

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
    WHERE coaches.region = ?
    GROUP BY
        coaches.id,
        coaches.name,
        coaches.last_name,
        coaches.sex
    ORDER BY coaches.id;`

    try {
        const row = await pool.promise().execute(query, [region]);
        let coaches = row[0];
        // console.log(coaches);

        res.status(200).json(coaches);
    } catch (error) {
        res.status(500).json({error: "errore nel server"});
    }
    return;
});

// ************************************
//
// This section covers login.html routes
//
// ************************************

app.post("/api/login", async (req, res) =>{
    const {username, password} = req.body;
    const query = "SELECT id, user_name FROM utenti3 WHERE user_name = ? AND password = ?";
    try {
        const [righe, colonne] = await pool.promise().execute(query, [username, password]);
        const user = righe[0];

        // This payload contains the information about the user
        const payload = {
            userID: user.id,
            userName: user.user_name
        };

        // We transform the payload into a token cripted
        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h"
        });

        // The token has a expiration time of 1000 hours
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
        res.json({error: "Login fallito"});
    }
});

// ************************************
//
// This section covers login.html routes
//
// ************************************

app.get("/api/profile", async (req, res)=>{
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
            const user = righe[         0];

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

app.patch("/api/change-username",authenticateToken, async (req, res)=>{
    const username = req.body.user_name;
    const id = req.user.userID;

    const query = `UPDATE utenti3 SET utenti3.user_name = ? WHERE utenti3.id = ?;`    

    try {
        const row = await pool.promise().execute(query, [username, id]);

        return res.status(200).json({
            message: "Nome utente aggiornato con successo"
        });

    } catch (error) {
        // console.log("Errore: ", error);
        if (error.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                error : "Username già in utilizzo"
            })
        }
        return res.status(500).json({error: "Errore durante l'aggiornamento"});
    }
});

// ***************************************
//
// This section covers explore.html routes
//
// ***************************************

app.get("/api/disciplines", async (req, res) =>{
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

app.get("/api/coach-list", async (req, res) =>{
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

app.get('/api/coach.html', async (req, res) => {
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


// 404 Handling must be one of the last route
app.use((req, res) => { res.status(404).sendFile(__dirname + '/public/404.html'); });


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}/public/index.html`);
});
