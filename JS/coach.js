import { createPopup, removePopup, setPopup } from "./notify.js";

window.addEventListener("load", async function(){
    const coach_id = window.location.search; if(coach_id){
        try {
            const res = await fetch(`/GET/coach-info${coach_id}`, {
                method: "GET",
                headers: {"Content-Type": "application/json"},
            });

        const data = await res.json();
        const coach = data[0];

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
        const lname_coach_p = document.createElement("span");
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

function getLastMon(date = new Date){
    const mon = new Date(date);
    const diffDays = (mon.getDay() + 6) % 7;

    mon.setDate(mon.getDate() - diffDays);
    mon.setHours(0, 0, 0, 0);

    return mon;
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

// Date object that will keep track of week range that the user is watching.
let date2 = new Date();

// start time and end time of the coach for a single day
let global_start_time;
let end_time;

// Possible values: 0=Mon, 1=Tue, ...
let selected_day
let selected_time_slot

// This variable contains time infos about the coach.
let coach_schedule;


const pagaParams = new URLSearchParams(window.location.search);
const coach_id = pagaParams.get("coach_id");

document.getElementById("book-button").addEventListener("click", async function(){
    // re-initialize date
    date2 = getLastMon(new Date);
    let overlay = document.getElementById("overlay");
    overlay.classList.remove("hidden")
    let book_div = document.getElementById("book-div")
    book_div.classList.remove("hidden")

    let start_date = date2.toLocaleDateString("it-IT").split("/").reverse().join("-");
    let end_date = sumDays(date2, 7).split("-").reverse().join("-");

    let formatted_text = formattedweek(start_date, end_date);

    let text_week = document.getElementById("booking-week");
    text_week.textContent = formatted_text;

    try {


        let params = new URLSearchParams({
            coach_id,
            start_date,
            end_date
        })

        const res = await fetch(`/GET/coach-dates?${params}`,{
            method: 'GET',
        });

        const data = await res.json();
        coach_schedule = data.schedule;
        

        coach_schedule.forEach(day=> {
            document.querySelector(`[data-day="${day.day_of_week}"]`)?.classList.remove("hidden");
        });
        

    } catch (error) {
        console.log("Errore: ", error);
    }

});

document.getElementById("close-booking-s").addEventListener("click", async function(){
    document.getElementById("overlay").classList.add("hidden");
    document.getElementById("book-div").classList.add("hidden");
});

// left arrow behaviour
document.getElementById("booking-left-arrow").addEventListener("click", function(){
    if(date2 < new Date()){ return;}
    date2.setDate(date2.getDate() - 8);

    let start_date = date2.toLocaleDateString("it-IT").split("/").reverse().join("-");
    let end_date = sumDays(date2, 7).split("-").reverse().join("-");

    let formatted_text = formattedweek(start_date, end_date);

    let text_week = document.getElementById("booking-week");
    text_week.textContent = formatted_text;
});

// right arrow behaviour
document.getElementById("booking-right-arrow").addEventListener("click", function(){
    date2.setDate(date2.getDate() + 8);

    let start_date = date2.toLocaleDateString("it-IT").split("/").reverse().join("-");
    let end_date = sumDays(date2, 7).split("-").reverse().join("-");

    let formatted_text = formattedweek(start_date, end_date);

    let text_week = document.getElementById("booking-week");
    text_week.textContent = formatted_text;
});

// function that make appear time-slot according to coache's schedule
document.querySelectorAll('input[name="day"]').forEach(input => {
    input.addEventListener("change", async (event) =>{
        
        coach_schedule.forEach(day =>{
            if (day.day_of_week == event.target.value) {
                let time_slot = document.querySelector(".time-slot-div");

                selected_day = parseInt(event.target.value);

                let prov_date= new Date(date2);
                let cd = sumDays(prov_date, selected_day)
                
                time_slot.innerHTML = "";
                let start_time = parseInt(day.start_time.split(":")[0])
                let end_time = parseInt(day.end_time.split(":")[0])

                // try {
                //     const data = await fetch("/get-booked-datec",{
                //         method: "GET",
                //     })
                // } catch (error) {
                //
                // }

                while(start_time < end_time){
                    let radio = document.createElement("input");
                    radio.type = "radio";
                    radio.name = "time";
                    radio.id = `${start_time}`;
                    let label = document.createElement("label");
                    label.textContent= `${start_time}:00-${start_time+1}:00`;
                    label.id = `label-${start_time}`
                    label.htmlFor =  `${start_time}`;

                    time_slot.appendChild(radio);
                    time_slot.appendChild(label);
                    start_time++;
                }
            }
        });

    });
});

// Radio delegator, since I've created radios dinamically, we can't call the listener globabally since are not created yet a the start-time of the page.
const time_container = document.querySelector(".time-slot-div");

time_container.addEventListener("change", event => {
    if (event.target.matches('input[type="radio"][name="time"]')){
        document.getElementById("date-book-button").classList.remove("hidden2");
        global_start_time = event.target.id;
        global_start_time = document.getElementById(`label-${global_start_time}`).textContent;
    }
});


document.getElementById("date-book-button").addEventListener("click", async function(){

    if (!global_start_time || !selected_day) {
        return;
    }

    const timeVar1 = sumDays(date2, selected_day - 1).split("-").reverse().join("-") + " " + global_start_time.split("-")[0] + ":00";
    const timeVar2 = sumDays(date2, selected_day - 1).split("-").reverse().join("-") + " " + global_start_time.split("-")[1] + ":00";

    try {
         const res = await fetch("/booking",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                coach_id: coach_id,
                start_time: timeVar1,
                end_time: timeVar2
            })
         });

        if (res.status == 401) {
            window.location.replace("/public/login.html");
            return;
        }


        if (res.status == 409) {
            setPopup("Orario già prenotato", "Provare a scegliere un altro orario", document.getElementById("main-div-coach"));
            return;
        }

        const data = await res.json();
        const res_div = document.getElementById("booking-response-div");
        let res_p = document.createElement("p");
        res_p.textContent = `Prenotazione eseguita per il giorno ${timeVar1.split(" ")[0]} alle ore: ${timeVar1.split(" ")[1]}-${timeVar2.split(" ")[1]}`;
        res_div.appendChild(res_p);
        
        
    } catch (error) {
        console.log("Error:", error);
    }
});
