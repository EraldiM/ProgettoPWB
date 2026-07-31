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
        return res.redirect(302, "/login.html");
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.redirect(302, "/index.html");
    }
}

function redirectIfAuthenticated(req, res, next){
    const token = req.cookies.token;
    console.log("sono qua");

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

        console.log(user.user_name);

        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1h"
        });

        res.cookie("token", token,{
            httpOnly: true,
            secure: true,
            maxAge: 36000000,
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

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
})
