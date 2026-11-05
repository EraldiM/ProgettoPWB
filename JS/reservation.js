import {setPopup} from './notify.js'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const mainDiv = document.getElementById("reservation-main-div");
const frd = document.getElementById("future-reservation-div");
const futureSentinel = document.getElementById("future-sentinel");
const futureList = document.getElementById("future-reservation-list");
const pastList = document.getElementById("past-reservation-list");
const prd = document.getElementById("past-reservation-div");
const pastSentinel = document.getElementById("past-sentinel");

let lastFutureReservationId;
let lastFutureReservationDate;
let lastPastReservationId;
let lastPastReservationDate;
let loadingFuture = false;
let hasMoreFuture = true;
let loadingPast = false;
let hasMorePast = true;

function createSpinner(){
    const wrapper = document.createElement("span");
    wrapper.classList.add("spinner");
    const spinner = document.createElement("i");
    spinner.classList.add("fas", "fa-spinner", "fa-spin");
    spinner.setAttribute("role", "status");

    wrapper.appendChild(spinner);
    return wrapper;

}

async function renderFutureReservation(reservation){

    let fullname = reservation.coach_last_name + " " + reservation.coach_name;

    // getting to format of the reservation as: YYYY:MM:DD start HH:mm - end HH:mm
    let giorno = reservation.start_at.replace("T" , " ").slice(0, reservation.start_at.indexOf(":",reservation.start_at.indexOf(":") + 1)) + ' - '+ reservation.end_at.split("T")[1].slice(0, 5);
    console.log(giorno);

    let coachNameSpan = document.createElement("span");
    coachNameSpan.textContent = fullname;

    let reservationDate = document.createElement("span");
    reservationDate.textContent = giorno;

    let reservationStatus= document.createElement("span");
    reservationStatus.textContent = reservation.status;

    frd.appendChild(reservationDate);
    frd.appendChild(coachNameSpan);
    frd.appendChild(reservationStatus);

}

function renderPastReservation(reservation){

    let fullname = reservation.coach_last_name + " " + reservation.coach_name;

    // getting to format of the reservation as: YYYY:MM:DD start HH:mm - end HH:mm
    let giorno = reservation.start_at.replace("T" , " ").slice(0, reservation.start_at.indexOf(":",reservation.start_at.indexOf(":") + 1)) + ' - '+ reservation.end_at.split("T")[1].slice(0, 5);
    console.log(giorno);

    let coachNameSpan = document.createElement("span");
    coachNameSpan.textContent = fullname;

    let reservationDate = document.createElement("span");
    reservationDate.textContent = giorno;

    let reservationStatus = document.createElement("span");
    reservationStatus.textContent = reservation.status;

    prd.appendChild(reservationDate);
    prd.appendChild(coachNameSpan);
    prd.appendChild(reservationStatus);
}
window.addEventListener("load", async function(){

    // Making the fetch for future reservaions
    try {
        const res = await fetch("/api/get-past-and-future-reservation", {
            method: "GET"
        });

        if(!res.ok){
            setPopup("Non è possibile richiedere le prenotazioni future", "riprovare più tardi", mainDiv);
            return;
        }

        const data = await res.json();
        
        console.log(data.fr);
        if (data.fr.length > 0) {
            frd.classList.remove("reservation-empty-state");
            frd.classList.add("future-reservation-class");

            let day = document.createElement("b");
            day.textContent = "Giorno:"
            let coachName = document.createElement("b");
            coachName.textContent = "Nome del coach:"
            let state = document.createElement("b");
            state.textContent = "Stato dell'appuntamento:";
            frd.textContent = "";
            frd.appendChild(day);
            frd.appendChild(coachName);
            frd.appendChild(state);
            data.fr.forEach(ele => {
                renderFutureReservation(ele);
            });

            const last = data.fr[data.fr.length - 1];
            lastFutureReservationId = last.id
            lastFutureReservationDate = last.start_at;

            futureObserver.observe(futureSentinel);
        }

        if (data.pr.length > 0) {
            prd.classList.remove("reservation-empty-state");
            prd.classList.add("future-reservation-class");

            let day = document.createElement("b");
            day.textContent = "Giorno:"
            let coachName = document.createElement("b");
            coachName.textContent = "Nome del coach:"
            let state = document.createElement("b");
            state.textContent = "Stato dell'appuntamento:";
            prd.textContent = "";
            prd.appendChild(day);
            prd.appendChild(coachName);
            prd.appendChild(state);
            data.pr.forEach(ele => {
                renderPastReservation(ele);
            });

            const last = data.pr[data.pr.length - 1];
            lastPastReservationId = last.id
            lastPastReservationDate = last.start_at;

            console.log(pastSentinel);
            pastObserver.observe(pastSentinel);
        }
    } catch (error) {
        console.log("Errore: ", error);
    }  
});



async function loadMoreFutureReservations(){
    if (loadingFuture || !hasMoreFuture) return; 

    loadingFuture = true
    const spinner = createSpinner();
    futureSentinel.appendChild(spinner);

    try{

        let params = new URLSearchParams({
                reservationId: lastFutureReservationId,
                reservationDate: lastFutureReservationDate
        })
       
        const [res] = await Promise.all([fetch(`/api/get-more-future-reservation?${params}`,{
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }), sleep(1000)]);

        if (!res.ok) {
            hasMoreFuture = false;
            return;
        }

        const data = await res.json();

        data.forEach((ele) =>{
            renderFutureReservation(ele);
        });

        if (data.length < 5){
            hasMoreFuture= false;
            const NoMoreFutureResP = document.createElement("p");
            NoMoreFutureResP.textContent = "Non ci sono più prenotazioni future."
            futureSentinel.appendChild(NoMoreFutureResP);
            return;
        }

        const last = data[data.length - 1];
        lastFutureReservationId = last.id
        lastFutureReservationDate = last.start_at;
    } finally{
        loadingFuture = false;
        spinner.remove();
    }
}

async function loadMorePastReservations(){
    if (loadingPast || !hasMorePast) return; 

    loadingPast = true
    const spinner = createSpinner();
    pastSentinel.appendChild(spinner);
    try{


        let params = new URLSearchParams({
                reservationId: lastPastReservationId,
                reservationDate: lastPastReservationDate 
        })
       
        const [res] = await Promise.all([fetch(`/api/get-more-past-reservation?${params}`,{
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }), sleep(1000)]);

        console.log(res.ok);
        if (!res.ok) {
            hasMorePast = false;
            return;
        }

        const data = await res.json();
        console.log(data);

        data.forEach((ele) =>{
            renderPastReservation(ele);
        });

        if (data.length < 5){
            hasMorePast = false;
            const NoMorePastResP = document.createElement("p");
            NoMorePastResP.textContent = "Non ci sono più prenotazioni passate."
            pastSentinel.appendChild(NoMorePastResP);
            return;
        }

        const last = data[data.length - 1];
        lastPastReservationId = last.id
        lastPastReservationDate = last.start_at;

        console.log("last res id:", lastPastReservationId);
        console.log("last res date:", lastPastReservationDate);

    } finally{
        loadingPast = false;
        spinner.remove();
    }
}

const futureObserver = new IntersectionObserver((entries) =>{
    if (entries[0].isIntersecting){
        loadMoreFutureReservations();
    }
},{
    root: futureList,
    rootMargin: "0px 0px 0px 0px"
})

const pastObserver = new IntersectionObserver((entries) =>{
    if (entries[0].isIntersecting){
        loadMorePastReservations();
    }
},{
    root: pastList,
    rootMargin: "0px 0px 0px 0px"
})

