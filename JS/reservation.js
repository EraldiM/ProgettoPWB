import { setPopup, createSpinner, sleep } from "./utils.js";
const mainDiv = document.getElementById("reservation-main-div");
const frd = document.getElementById("future-reservation-div");
const futureSentinel = document.getElementById("future-sentinel");
const futureList = document.getElementById("future-reservation-list");
const pastList = document.getElementById("past-reservation-list");
const prd = document.getElementById("past-reservation-div");
const pastSentinel = document.getElementById("past-sentinel");
const reviewDialog = document.getElementById("review-dialog");
const cancellationDialog = document.getElementById("cancellation-dialog");
const closeCancellation = document.getElementById("close-cancellation");
const submitCancellation = document.getElementById("submit-cancellation");
const stars = document.querySelectorAll(".star")

let lastFutureReservationId;
let lastFutureReservationDate;
let lastPastReservationId;
let lastPastReservationDate;
let loadingFuture = false;
let hasMoreFuture = true;
let loadingPast = false;
let hasMorePast = true;
let selectedBookingId = null;
let selectedReviewBtn = null;
let selectedCancellationButton = null;
let selectedReservationStatus = null;
let ratingSelected = 0;

async function renderFutureReservation(reservation){

    let fullname = reservation.coach_last_name + " " + reservation.coach_name;

    // getting to format of the reservation as: YYYY:MM:DD start HH:mm - end HH:mm
    let giorno = reservation.start_at.replace("T" , " ").slice(0, reservation.start_at.indexOf(":",reservation.start_at.indexOf(":") + 1)) + ' - '+ reservation.end_at.split("T")[1].slice(0, 5);

    let coachNameSpan = document.createElement("span");
    coachNameSpan.textContent = fullname;

    let reservationDate = document.createElement("span");
    reservationDate.textContent = giorno;

    let reservationStatusP = document.createElement("p"); 
    reservationStatusP.classList.add("reservation-status");

    let reservationStatus = document.createElement("span");
    reservationStatus.textContent = reservation.status;

    let cancelReservationBtn = document.createElement("button")
    cancelReservationBtn.type = "button";
    cancelReservationBtn.classList.add("cancel-reservation-button");


    reservationStatusP.appendChild(reservationStatus);
    if (reservation.status != 'cancelled'){

        let trashIcon = document.createElement("i");
        trashIcon.classList.add("far", "fa-trash-alt")

        cancelReservationBtn.appendChild(trashIcon);
        cancelReservationBtn.addEventListener("click", async function(){
            selectedBookingId = reservation.id;
            selectedCancellationButton = cancelReservationBtn;
            console.log(selectedBookingId);
            selectedReservationStatus = reservationStatus;
            cancellationDialog.showModal()
        });
        reservationStatusP.appendChild(cancelReservationBtn);
    }

    frd.appendChild(reservationDate);
    frd.appendChild(coachNameSpan);
    frd.appendChild(reservationStatusP);

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

    let reservationStatus = document.createElement("p");
    reservationStatus.classList.add("reservation-status");
    reservationStatus.textContent = reservation.status;

    if (reservation.status === "completed" && reservation.reviewed_booking_id === null){
        let reviewBtn = document.createElement("button");
        reviewBtn.type = "button";
        reviewBtn.classList.add("button-3", "review-button");
        reviewBtn.textContent = "Recensisci";
        reservationStatus.appendChild(reviewBtn);
        reviewBtn.addEventListener("click", () =>{
            selectedBookingId = reservation.id;
            selectedReviewBtn = reviewBtn;
            reviewDialog.showModal();
        });
    }

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
            lastFutureReservationDate = last.cursor_start_at;

            hasMoreFuture = data.fr.length === 5;
            if (hasMoreFuture) futureObserver.observe(futureSentinel);
        }

        if (data.pr.length > 0) {
            prd.classList.remove("reservation-empty-state");
            prd.classList.add("future-reservation-class");
            console.log(data.pr);

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
            lastPastReservationDate = last.cursor_start_at;

            hasMorePast = data.pr.length === 5;
            if (hasMorePast) pastObserver.observe(pastSentinel);
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
        lastFutureReservationDate = last.cursor_start_at;
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
        lastPastReservationDate = last.cursor_start_at;

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

reviewDialog.addEventListener("click", (event) => {
  const rect = reviewDialog.getBoundingClientRect();

  const out =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (out) {
    reviewDialog.close();
  }
});

cancellationDialog.addEventListener("click", (event) => {
  const rect = cancellationDialog.getBoundingClientRect();

  const out =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (out) {
    cancellationDialog.close();
  }
});

closeCancellation.addEventListener("click", ()=>{
    cancellationDialog.close();
});

stars.forEach((star,index) =>{
    star.addEventListener("mouseenter", ()=>{
        for (let i = 0; i < stars.length; i++) {
            const svg = stars[i].querySelector("svg");
            if (i<=index) {
                svg.classList.remove("far");
                svg.classList.add("fas");
                svg.classList.add("gold");
            }else if(index < ratingSelected && i < ratingSelected){
                svg.classList.add("dark-gold");
            }
            else{
            svg.classList.remove("fas");
            svg.classList.add("far");
            svg.classList.remove("gold");
            }
        }
    });
    star.addEventListener("mouseleave", ()=>{
        for (let i = 0; i < stars.length; i++) {
            const svg = stars[i].querySelector("svg");
            if(i<ratingSelected){
                svg.classList.remove("far");
                svg.classList.remove("dark-gold");
                svg.classList.add("fas");
                svg.classList.add("gold");
            }else{
                svg.classList.remove("fas");
                svg.classList.add("far");
                svg.classList.remove("gold");
                svg.classList.remove("dark-gold");
            }
        };
    });
    star.addEventListener("click", ()=>{
        ratingSelected = index +1;
        for (let i = 0; i < stars.length; i++) {
            const svg = stars[i].querySelector("svg");
            if (i+1<=ratingSelected) {
                svg.classList.remove("far");
                svg.classList.remove("dark-gold");
                svg.classList.add("fas");
                svg.classList.add("gold");
            }else{
                svg.classList.remove("fas");
                svg.classList.add("far");
                svg.classList.remove("gold");
                svg.classList.remove("dark-gold");
            }
        }
    })
});

submitCancellation.addEventListener("click", async function(event){
    event.preventDefault();
    try {
        let id = new URLSearchParams({id: selectedBookingId});
        const res = await fetch(`/api/cancel-reservation/?${id}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
        });

        const data = await res.json();

        if(!res.ok){
            return setPopup("Non è stato possibile cancellare la prenotazione", "Riprovare più tardi.", cancellationDialog);
        }
        console.log(data);
        cancellationDialog.close();
        selectedCancellationButton.remove();
        selectedCancellationButton = null;
        selectedBookingId = null;
        selectedReservationStatus.textContent = "cancelled";
        selectedReservationStatus = null;
        return setPopup("Prenotazione cacellato con successo","",mainDiv);

        
    } catch (error) {
        return console.log("Error:", error);
    }
})


document.getElementById("close-review-dialog").addEventListener("click", ()=>{
    reviewDialog.close();
})

document.getElementById("submit-review").addEventListener("click", async function(event){
    event.preventDefault();
    const reviewText = document.getElementById("review-text").value;

    if (ratingSelected > 5 || ratingSelected <= 0){
        return setPopup("Selezionare una valutazione per la visita", "", reviewDialog);
    }

    try {
        
        const res =  await fetch("/api/post-review",{
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        id: selectedBookingId,
                                        rating: ratingSelected,
                                        review: reviewText
                                    })
                                });
        const data = await res.json();

        if (!res.ok){
            return setPopup("Errore", "Non è stato possibile inviare la recensione, provare più tardi", reviewDialog);
        }

        setPopup("Recensione inviata con successo", "", mainDiv);

        selectedReviewBtn.remove();
        selectedReviewBtn = null;
        selectedBookingId = null;
        reviewDialog.close();

    } catch (error) {
        console.log("Errore:", error) 
    }
});
