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
// This function provides an authentication method checking the token (if present) provided by the client 
// and if the Token if invalid we redirect him on the login page.
// The redirect can only be performed on action like, trying to visit profile page while not authenticated.
function unauthenticateToken(req, res){
    if (req.path.startsWith("/api/")){
        return res.status(401).json({error: "Sessione scaduta"});
    }
    return res.redirect(302, "/public/new_login.html");
}

function authenticateToken(req, res, next){
    const token = req.cookies.token;
    if (!token){ // if the user is not authenticated we redirect him on the login page
        return unauthenticateToken(req, res);
    }
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        return unauthenticateToken(req, res);
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
app.get("/public/new_login.html", redirectIfAuthenticated,(req,res) => {res.sendFile(__dirname + "/public/new_login.html")});
app.get("/public/new_signin.html", redirectIfAuthenticated,(req,res) => {res.sendFile(__dirname + "/public/new_signin.html")});
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
// This section covers login.html routes
//
// ************************************

app.post("/api/login", async (req, res) =>{
    const {username, password} = req.body;
    const query = "SELECT id, user_name FROM utenti3 WHERE user_name = ? AND password = ?";
    try {
        const [row] = await pool.promise().execute(query, [username, password]);
        const user = row[0];

        // No username and password matches the request
        if (!user){
            return res.status(401).json({
                success: false,
                error: "Nome utente o password non corretti"
            });
        }

        // This payload contains the information about the user
        const payload = {
            userID: user.id,
            userName: user.user_name
        };

        // We transform the payload into a token cripted
        const token = jwt.sign(payload, JWT_SECRET, {
            algorithm: "HS256",
            expiresIn: "1000h"
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
            const row = await pool.promise().execute(query, [id]);
            const user = row[0];

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

const usernameRegex = /^[A-Za-z][A-Za-z0-9._-]{3,19}$/;
const nameRegex = /^[A-Za-z]{1,50}$/;
const passwordRegex =
    /^(?=.*\p{Lu})(?=.*\p{Nd})(?=.*[\p{P}\p{S}])\S{6,20}$/u;

function isFilled(value) {
    return typeof value === "string" && value.trim() !== "";
}

function isRealDate(value) {
    // We create 3 separete checks for year, month and day. If the values are invalid we return.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;

    // We then Normalize the values to metch them with a valid date.
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);

    return date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;
}

function dateYearsAgo(today, years) {
    const year = today.getFullYear() - years;
    const month = today.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(today.getDate(), lastDay);

    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function validateSignup(body) {
    const errors = {};
    const data = body && typeof body === "object" && !Array.isArray(body) ? body : {};

    const { user_name, name, last_name, sex, birth_date, password, confirm_password } = data;

    if (!isFilled(user_name)) {
        errors.user_name = "Il nome utente è obbligatorio.";
    } else if (!usernameRegex.test(user_name)) {
        errors.user_name = "Nome utente non valido.";
    }

    if (!isFilled(name)) {
        errors.name = "Il nome è obbligatorio.";
    } else if (!nameRegex.test(name)) {
        errors.name = "Il nome deve contenere da 1 a 50 lettere.";
    }

    if (!isFilled(last_name)) {
        errors.last_name = "Il cognome è obbligatorio.";
    } else if (!nameRegex.test(last_name)) {
        errors.last_name = "Il cognome deve contenere da 1 a 50 lettere.";
    }

    if (sex !== "maschio" && sex !== "femmina") {
        errors.sex = "Seleziona il sesso.";
    }

    // We check if birthdate is given, we then check is a possible date is given, we then check if the date given if accepted (the person bust be older than 10 and younger than 100 years).
    if (!isFilled(birth_date)) {
        errors.birth_date = "La data di nascita è obbligatoria.";
    } else if (!isRealDate(birth_date)) {
        errors.birth_date = "Data di nascita non valida.";
    } else {
        const today = new Date();
        const oldest = dateYearsAgo(today, 100);
        const newest = dateYearsAgo(today, 10);

        if (birth_date < oldest || birth_date > newest) {
            errors.birth_date = "L'età deve essere compresa tra 10 e 100 anni.";
        }
    }

    if (!isFilled(password)) {
        errors.password = "La password è obbligatoria.";
    } else if (!passwordRegex.test(password)) {
        errors.password = "Password non valida.";
    }

    if (!isFilled(confirm_password)) {
        errors.confirm_password = "Conferma la password.";
    } else if (confirm_password !== password) {
        errors.confirm_password = "Le password non coincidono.";
    }

    return errors;
}

app.post("/api/signin", async (req, res)=>{
    const errors = validateSignup(req.body);

    // Handling fields checks for the server.

    if (Object.keys(errors).length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    const {user_name, name, last_name, sex, birth_date, password} = req.body;

    const query = "INSERT INTO utenti3 (user_name, password, name, last_name, sex, birth_date) VALUES(?, ?, ?, ?, ?, ?)";
    let righe;
    let user;
    try{
        righe = await pool.promise().execute(query, [user_name, password, name, last_name, sex == "maschio" ? 1 : 0, birth_date]);
        user = righe[0];

    }catch(error){

        console.log("INSERT utenti3 fallito:", {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState
        });

        if (error.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                success: false,
                error: "Nome utente già utilizzato."
            });
        }
        if (error.code === "ER_DISK_FULL" || error.code === "ER_RECORD_FILE_FULL"){
            return res.status(503).json({
                success: false,
                error: "Attualmente impossibile aggiungere nuovi utenti."
            });
        }

        return res.status(500).json({
            success: false,
            error: "Errore interno dureante la registrazione dell'utente"
        });
    }

    const payload = {
        userID: user.insertId,      // InsertId Is the Id (primary key) of the user that has been just added.
        userName: user_name
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
    coaches.region,
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

        res.json(coaches);
    } catch (error) {
        console.log(error);
        return res.status(401).json({error: "Errore nel database"});
    }
});

app.get("/GET/more-coaches", async (req, res) => {
    const query =` SELECT 
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex,
    coaches.region,
    JSON_ARRAYAGG(
      coaches_categories.category_name
      ORDER BY coaches_categories.category_name
    ) AS categories
    FROM coaches
    INNER JOIN coaches_categories
    ON coaches.id = coaches_categories.id_coach
    WHERE coaches.id > ?
    AND coaches.name LIKE CONCAT('%', ?, '%')
    AND (
        ? = ''
        OR EXISTS (
            SELECT 1
            FROM coaches_categories AS filter_category
            WHERE filter_category.id_coach = coaches.id
                AND filter_category.category_name = ?
        )
    )
    GROUP BY
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex
    ORDER BY coaches.id
    LIMIT 6; `
    ;

    let coach_id = req.query.coach_id;
    let coach_name = req.query.coach_name;
    let discipline_name = req.query.discipline;
    try {
        const row =  await pool.promise().execute(query, [coach_id, coach_name, discipline_name, discipline_name]);

        const coaches = row[0];

        res.json(coaches);

    } catch (error) {
        console.log("errore del DB: " + error);
        res.json(error);
    }
});

app.get("/api/filtered-coach", async (req, res) => {
    let coach_id = req.query.coach_id;
    let discipline_name = req.query.discipline;
    let coach_name = req.query.coach_name;
    // the following line rapresents the two possibile queries we can perform. The user can select a name or not fot the coach. We have a ternary operator that checks if coach_name has been specified.
    const query =` SELECT 
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
    AND coaches.name LIKE CONCAT('%', ?, '%')
    AND (
        ? = ''
        OR EXISTS (
            SELECT 1
            FROM coaches_categories AS filter_category
            WHERE filter_category.id_coach = coaches.id
                AND filter_category.category_name = ?
        )
    )
    GROUP BY
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.sex
    ORDER BY coaches.id
    LIMIT 6; `
    ;
    
    try {
        const row = await pool.promise().execute(query, [coach_id, coach_name, discipline_name, discipline_name]);
        const coaches = row[0];

        res.json(coaches);
    } catch (error) {
        console.log("errore del DB: " + error);
        res.json(error);
    }
});

// ***************************************
//
// This section covers coach.html routes
//
// ***************************************

app.get("/api/coach-info", async (req, res) =>{
    const coach_id = req.query.coach_id;
    const query = `SELECT
    coaches.id,
    coaches.name,
    coaches.last_name,
    coaches.phone,
    coaches.email,
    coaches.sex,
    coaches.region,
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

        res.json(coach);

    } catch (error) {
        console.log("Errore zio can: " + error);
    }
});

app.get("/api/coach-reviews", async (req, res) =>{
    const coach_id = req.query.coach_id;
    if (!coach_id || !/^[1-9]\d*$/.test(coach_id)) {
        return res.status(400).json({error: "Coach non valido"});
    }

    const summaryQuery = `
        SELECT COUNT(*) AS total_reviews, ROUND(AVG(r.rating), 1) AS average_rating
        FROM reviews AS r
        INNER JOIN bookings AS b ON b.id = r.booking_id
        WHERE b.coach_id = ?;
    `;
    const reviewsQuery = `
        SELECT u.user_name, r.rating, r.review,
            DATE_FORMAT(b.start_at, '%Y-%m-%d %H:%i') AS meeting_date
        FROM reviews AS r
        INNER JOIN bookings AS b ON b.id = r.booking_id
        INNER JOIN utenti3 AS u ON u.id = b.user_id
        WHERE b.coach_id = ?
        ORDER BY r.rating DESC, r.creation_date DESC, r.booking_id DESC
        LIMIT 10;
    `;

    try {
        const [summaryRows] = await pool.promise().execute(summaryQuery, [coach_id]);
        const [reviews] = await pool.promise().execute(reviewsQuery, [coach_id]);

        return res.status(200).json({
            totalReviews: Number(summaryRows[0].total_reviews),
            averageRating: Number(summaryRows[0].average_rating),
            reviews
        });
    } catch (error) {
        console.error("Errore nel caricamento delle recensioni:", error);
        return res.status(500).json({error: "Impossibile caricare le recensioni"});
    }
});


app.get("/api/coach-dates", async (req, res)=>{
    const {coach_id, startDate, endDate} = req.query;

    const query = `SELECT DISTINCT day_of_week, start_time, end_time FROM coach_working_hours WHERE coach_id = ? ORDER BY day_of_week;`
    const query2 = `SELECT * FROM bookings
        WHERE coach_id = ?
        AND status IN ('confirmed', 'pending')
        AND start_at < ?
        AND end_at > ?; `
    try {
        const [schedule] = await pool.promise().execute(query, [coach_id]);
        const [booking] = await pool.promise().execute(query2, [coach_id, endDate, startDate]);

        res.json({
            schedule,
            booking
        });
         
    } catch (error) {
        console.log("Errore: ", error);
    }
});

function parseDateTime(time){
    if (typeof time !== "string") return null;

    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(time);
    if (!match) return null;

    const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
    const date = new Date(year, month - 1, day, hour, minute, second);

    // Date normalizza valori impossibili, per esempio il 31 febbraio.
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day ||
        date.getHours() !== hour ||
        date.getMinutes() !== minute ||
        date.getSeconds() !== second) return null;

    return date;
    }

function checkForInvalidParameters(coach_id, user_id, start_time, end_time){
    const validId = id =>{
        return typeof id === "number" ?
            Number.isSafeInteger(id) && id > 0:
            typeof id === "string" &&
            /^[1-9]\d*$/.test(id) &&
            Number.isSafeInteger(Number(id))
    }

    if(!validId(coach_id) || !validId(user_id)){return true}


    // We only accept dates in the format YYYY:MM:DD HH:mm:ss
    let startDate = parseDateTime(start_time);
    let endDate = parseDateTime(end_time);

    if (!startDate|| !endDate|| startDate > endDate){
        return true;
    }

    if (startDate.getFullYear() === endDate.getFullYear() && startDate.getMonth() === endDate.getMonth() && startDate.getDate()=== endDate.getDate() && endDate.getTime() - startDate.getTime() === 60 * 60 * 1000){
        return false;
    }

    return true;
   
}

app.post("/api/booking", authenticateToken, async (req, res) =>{
    const {coach_id, start_time, end_time, notes} = req.body;
    const user_id = req.user.userID;

    if(checkForInvalidParameters(coach_id, user_id, start_time, end_time)) return res.status(400).json({error: "parametri non validi"});

    if (notes != null && (typeof notes !== "string" || notes.length > 1000)) {
        return res.status(400).json({error: "Le note devono essere un testo di massimo 1000 caratteri"});
    }
    const bookingNotes = notes?.trim() || null;

    const query = `INSERT INTO bookings (coach_id, user_id, start_at, end_at, notes) VALUES (?, ?, ?, ?, ?);`
    const query2 = `SELECT id FROM bookings WHERE coach_id = ? AND status IN ('pending', 'confirmed') AND start_at < ? AND end_at > ? LIMIT 1;`

    try {
        const [dup]= await pool.promise().execute(query2, [coach_id, end_time, start_time]);
        if (dup.length > 0) {
            return res.status(409).json({
                error: "È già presente una prenotazione allo stesso orario"
            })
        }


        const row = await pool.promise().execute(query, [coach_id, user_id, start_time, end_time, bookingNotes]);

        return res.status(201).json({
            success: "Prenotazione eseguita con successo",
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
});


// *******************************************
//
// This section covers reservation.html routes
//
// *******************************************

app.get("/api/get-past-and-future-reservation", authenticateToken, async (req, res) => {
    const user_id = req.user.userID;
    if (!user_id) { res.status(401).json({error: "Utente non autorizzato"}); }

    const queryFuture = `
        SELECT
            b.id,
            b.coach_id,
            DATE_FORMAT(b.start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
            DATE_FORMAT(b.end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
            b.status,
            DATE_FORMAT(b.start_at, '%Y-%m-%d %H:%i:%s') AS cursor_start_at,
            c.name AS coach_name,
            c.last_name AS coach_last_name
        FROM bookings AS b
        INNER JOIN coaches AS c ON c.id = b.coach_id
        WHERE b.user_id = ? AND b.start_at > NOW()
        ORDER BY b.start_at ASC, b.id ASC
        LIMIT 5;`
    ;
    const queryPast= `
        SELECT
            b.id,
            b.coach_id,
            DATE_FORMAT(b.start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
            DATE_FORMAT(b.end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
            b.status,
            DATE_FORMAT(b.start_at, '%Y-%m-%d %H:%i:%s') AS cursor_start_at,
            c.name AS coach_name,
            c.last_name AS coach_last_name,
            r.booking_id AS reviewed_booking_id
        FROM bookings AS b
        INNER JOIN coaches AS c ON c.id = b.coach_id
        LEFT JOIN reviews AS r ON r.booking_id = b.id
        WHERE b.user_id = ? AND b.start_at <= NOW()
        ORDER BY b.start_at DESC, b.id DESC
        LIMIT 5;`
    ;

    try {

        const [futureReservations] = await pool.promise().execute(queryFuture, [user_id]);
        const [pastReservations] = await pool.promise().execute(queryPast, [user_id]);

        res.json({
            pr: pastReservations,
            fr: futureReservations
        });
        
    } catch (error) {
        console.log("Error: ", error);
        return res.status(400).json({error: error});
    }
});

app.get("/api/get-more-future-reservation", authenticateToken, async (req, res) =>{
    const reservationId = req.query.reservationId;
    const reservationDate = req.query.reservationDate;
    let id = req.user.userID;

    if (!id || !reservationId || !reservationDate) {
        return res.status(400).json({error: "Errore, formato non valido"});
    }

    const query = ` SELECT
            b.id,
            b.coach_id,
            DATE_FORMAT(b.start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
            DATE_FORMAT(b.end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
            b.status,
            DATE_FORMAT(b.start_at, '%Y-%m-%d %H:%i:%s') AS cursor_start_at,
            c.name AS coach_name,
            c.last_name AS coach_last_name
        FROM bookings AS b
        INNER JOIN coaches AS c ON c.id = b.coach_id
        WHERE b.user_id = ? AND (b.start_at > ?
            OR (b.start_at = ? AND b.id > ?)
        )
        ORDER BY b.start_at ASC, b.id ASC
        LIMIT 5;
    `;

    try {
        
        const [reservations] = await pool.promise().execute(query, [id, reservationDate, reservationDate, reservationId]);


        res.status(200).json(reservations);
        
    } catch (error) {
        console.log("Error:", error);
        return res.status(400).json({errore: error});
    }
});

app.get("/api/get-more-past-reservation", authenticateToken, async (req, res) =>{
    const reservationId = req.query.reservationId;
    const reservationDate = req.query.reservationDate;
    let id = req.user.userID;

    if (!id || !reservationId || !reservationDate) {
        return res.status(400).json({error: "Errore, formato non valido"});
    }

    const query = ` SELECT
            b.id,
            b.coach_id,
            DATE_FORMAT(b.start_at, '%Y-%m-%dT%H:%i:%s') AS start_at,
            DATE_FORMAT(b.end_at, '%Y-%m-%dT%H:%i:%s') AS end_at,
            b.status,
            DATE_FORMAT(b.start_at, '%Y-%m-%d %H:%i:%s') AS cursor_start_at,
            c.name AS coach_name,
            c.last_name AS coach_last_name,
            r.booking_id AS reviewed_booking_id
        FROM bookings AS b
        INNER JOIN coaches AS c ON c.id = b.coach_id
        LEFT JOIN reviews AS r ON r.booking_id = b.id
        WHERE b.user_id = ? 
            AND (b.start_at < ? OR (b.start_at = ? AND b.id < ?)
            )
        ORDER BY b.start_at DESC, b.id DESC 
        LIMIT 5;
    `;

    try {
        
        const [reservations] = await pool.promise().execute(query, [id, reservationDate, reservationDate, reservationId]);


        res.status(200).json(reservations);
        
    } catch (error) {
        console.log("Error:", error);
        return res.status(500).json({error: "Impossibile caricare altre prenotazioni"});
    }
});

app.post("/api/post-review", authenticateToken, async (req, res)=>{
    const {id, rating, review} = req.body;
    const userId = req.user.userID;

    if(!id || rating > 5 || rating < 1) return res.status(400).json({error: "Dati inseriti non validi"});

    try {
        const query = `
            INSERT INTO reviews (booking_id, rating, review)
            SELECT b.id, ?, ?
            FROM bookings AS b
            WHERE b.id = ?
                AND b.user_id = ?
                AND b.status = 'completed'
        `;

        const [reviewState] = await pool.promise().execute(query, [rating, review, id, userId]);

        if (reviewState.affectedRows === 0) {
            return res.status(404).json({
                error: "Prenotazione non trovata o non accessibile"
            });
        }
        return res.status(200).json({success: true});
        
    } catch (error) {
        console.log(error);
        return res.status(409).json({error: "Aggiornare la pagina"});
    }
});

app.patch("/api/cancel-reservation",authenticateToken, async (req, res)=>{
    const id = req.query.id;
    const userId = req.user.userID;
    try {
        const query = `
            UPDATE bookings 
            SET status='cancelled'
            WHERE id=? AND
            user_id = ? AND 
            status IN ('pending', 'confirmed')
            AND start_at > NOW();
        `        
        const [reviewState] = await pool.promise().execute(query, [id, userId]);

        if (reviewState.affectedRows === 0) {
            return res.status(404).json({
                error: "Prenotazione non trovata o non cancellabile"
            });
        }
        res.status(200).json({success: true});
        
    } catch (error) {
        res.status(400).json({error: error});
    }
});

// 404 Handling must be one of the last route
app.use((req, res) => { res.status(404).sendFile(__dirname + '/public/404.html'); });


app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}/public/new_index.html`);
});
