window.addEventListener("load", async function(){
    const coach_id = window.location.search;
    if(coach_id){
    try {
        const res = await fetch(`/GET/coach-info${coach_id}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        });

        const data = await res.json();
        coach = data[0];

        // creting DOM elements for the coach in coach.html
        
        const coach_card = document.getElementById("coach-card-div");
        
        let name_div = document.createElement("p");
        name_div.classList.add("coach-p");
        let name_s = document.createElement("span");
        name_s.textContent = "Nome:";
        let coach_name_s = document.createElement("span");
        coach_name_s.textContent = coach.name;
        name_div.appendChild(name_s);
        name_div.appendChild(coach_name_s);
        coach_card.appendChild(name_div);

        let lname_div = document.createElement("p");
        lname_div.classList.add("coach-p");
        let lname_p = document.createElement("span");
        lname_p.textContent = "Cognome:";
        lname_coach_p = document.createElement("span");
        lname_coach_p.textContent = coach.last_name;
        lname_div.appendChild(lname_p);
        lname_div.appendChild(lname_coach_p);
        coach_card.appendChild(lname_div);

        let disciplines_div = document.createElement("div");
        disciplines_div.classList.add("coach-p");
        disciplines_div.id = "coach-disciplines-div";
        let disciplines_p = document.createElement("span");
        let disciplines_coach_ul = document.createElement("ul");
        disciplines_p.textContent = "Di cosa mi occupo:"
        coach.categories.forEach((element) => {
            let discipline = document.createElement("li");
            discipline.textContent = element;
            disciplines_coach_ul.appendChild(discipline);
        });
        disciplines_div.appendChild(disciplines_p);
        disciplines_div.appendChild(disciplines_coach_ul);
        coach_card.appendChild(disciplines_div);

        let phone_p = document.createElement("p");
        phone_p.classList.add("coach-p");
        let phone_text_s = document.createElement("span");
        phone_text_s.textContent = "Telefono:"
        let phone_n_s = document.createElement("span");
        phone_n_s.textContent = coach.phone;
        phone_p.appendChild(phone_text_s);
        phone_p.appendChild(phone_n_s);
        coach_card.appendChild(phone_p);

        let mail_p = document.createElement("p");
        mail_p.classList.add("coach-p");
        let mail_text_s = document.createElement("span");
        mail_text_s.textContent = "email:";
        let mail_s = document.createElement("span");
        mail_s.textContent = coach.email;
        mail_p.appendChild(mail_text_s);
        mail_p.appendChild(mail_s);
        coach_card.appendChild(mail_p);
    } catch (error) {
       console.log("Errore:", error);
    }
    }


});

function sumDays(ogDate, days){
    const date = new Date(ogDate);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("it-IT").replaceAll("/", "-");
}

function formattedweek(start, finish) {

    const dataInizio = new Date(`${start}T00:00:00`);
    const dataFine = new Date(`${finish}T00:00:00`);

    const giornoInizio = dataInizio.getDate();

    const fineFormattata = dataFine.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric"
    });

    return `${giornoInizio}–${fineFormattata}`;
}

const titolo = formattedweek("2026-09-21", "2026-09-27");

console.log(titolo);

document.getElementById("book-button").addEventListener("click", async function(){
    let overlay = document.getElementById("overlay");
    overlay.classList.remove("hidden")
    let book_div = document.getElementById("book-div")
    book_div.classList.remove("hidden")

    let date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let date2 = new Date(year, month - 1, day);
    let start_date = date2.toLocaleDateString("it-IT").split("/").reverse().join("-");
    console.log(start_date);
    let end_date = sumDays(date2, 10).split("-").reverse().join("-");

    let formatted_text = formattedweek(start_date, end_date);

    let text_week = document.getElementById("booking-week");
    text_week.textContent = formatted_text;

});
