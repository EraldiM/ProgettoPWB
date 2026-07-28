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

app.use(express.static(__dirname + "/public"));
app.use('/JS', express.static(__dirname + "/JS"));
app.use('/style', express.static(__dirname + "/style"));
app.use('/imgs', express.static(__dirname + "/imgs"));

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
})
