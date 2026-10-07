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
        console.log(coaches);

        res.status(200).json(coaches);
    } catch (error) {
        res.status(500).json({error: "errore nel server"});
    }
    return;
});


// 404 Handling must be one of the last route
app.use((req, res) => { res.status(404).sendFile(__dirname + '/public/404.html'); });


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}/public/index.html`);
})
