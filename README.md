# General information
This project has the goal to simulate website where you can browse though various fitness coaches. After creating an account you can also book and hypothetical visit with this coach. After the (hypothetical) visit took place you can also leave a review that can be see on coach's page.

this website is a university project for a course called 'Programmazione web e mobile', at the university of Perugia.

---
## Tecnology used
This project forced us to use the following tecnologies:
- HTML.
- CSS.
- JS.
- Node.
	- express.
	- cookie-parser
	- mysql2
	- jsonwebtoken
- A relational Database.
	- In this case I've used MariaDB.
No framework were allowed.

---
## Project structure
The project is divided in the Frontend and the Backend.
The the sides comunicate via fetch call.
The backend uses Node to comunicate with the Frontend using routes that manages the request.
The backend is also connected with the DB with a node module.

The structure of the project can be represented as follows:
```
.
├── app.js
├── coach.txt
├── image_db.txt
├── imgs
├── JS
│   ├── coach.js
│   ├── explore.js
│   ├── login.js
│   ├── notify.js
│   ├── profile.js
│   ├── script.js
│   └── signup.js
├── node_modules
├── package.json
├── package-lock.json
├── private
│   └── profile.html
├── public
│   ├── 404.html
│   ├── coach.html
│   ├── explore.html
│   ├── index.html
│   ├── login.html
│   └── signup.html
└── style
    └── style.css
```

the main folder are: **public** and **private**. The first contains the pages that can be reached without making the login. Private instead contains the pages where an account and a login is needed.

The login is made trough a username and a password, and this information is stored on the client with a cookie that must be authenticate every time the client performs an action where a login in needed (e.g. booking a visit with coach).

The backend is stored in the file called app.js .

---
# Goals
- Refactoring JS code.
- Refactoring the html and css.
- cleaning the code in app.js
- Make password hashed in DB.
- Add review system.
- add page where the user can see his past and make a review.
	- This implies and update on the DB.
- Coach page where they can confirm the appointment with the athelete.
- Advance search system in explore.