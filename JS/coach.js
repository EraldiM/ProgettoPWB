import { setPopup } from "./notify.js";

// Parametri della pagina e riferimenti agli elementi già presenti nell'HTML.
const pagaParams = new URLSearchParams(window.location.search);
const coach_id = pagaParams.get("coach_id");
const leftArrow = document.getElementById("booking-left-arrow");
const bookButton = document.getElementById("date-book-button");
const time_container = document.querySelector(".time-slot-div");
const selectedDaySpan = document.getElementById("selected-day-span");
const bookResponseDiv = document.getElementById("booking-response-div")
const bookingDiv = document.getElementById("booking-div");
const bookingNotes = document.getElementById("booking-notes");
const bookOptionButton = document.getElementById("button-booking-options");
const reviewSummary = document.getElementById("review-summary");
const reviewCarosel = document.getElementById("review-carosel");

// Stato condiviso tra caricamento delle disponibilità e selezione dello slot.
let date2 = getLastMon();
let coach_schedule = [];
let coachBooked = [];
let global_start_time;
let selected_day; // 0 = lunedì, 1 = martedì, ..., 6 = domenica.
let selected_time_slot;
let availabilityRequest;
let dayNumMonyear;

// Funzioni per le date.
function sumDays(ogDate, days) {
    const date = new Date(ogDate);
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("it-IT").replaceAll("/", "-");
}

function getLastMon(date = new Date()) {
    const mon = new Date(date);
    const diffDays = (mon.getDay() + 6) % 7;
    mon.setDate(mon.getDate() - diffDays);
    mon.setHours(0, 0, 0, 0);
    return mon;
}

function getDateFromString(dateString) {
    // Accetta sia le date ISO dell'API sia "YYYY-MM-DD HH:mm:ss".
    return new Date(dateString.replace(" ", "T"));
}

function formattedweek(start, finish) {
    const dataInizio = getDateFromString(start + "T00:00:00");
    const dataFine = getDateFromString(finish + "T00:00:00");
    const giornoInizio = dataInizio.getDate();
    const fineFormattata = dataFine.toLocaleDateString("it-IT", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    return `${giornoInizio}–${fineFormattata}`;
}

// Caricamento dei dati del coach.
async function loadCoach() {
    if (!coach_id) {
        return;
    }

    try {
        const res = await fetch(`/api/coach-info?${pagaParams}`);
        if (!res.ok) {
            throw new Error("Impossibile caricare il coach");
        }

        const data = await res.json();
        const coach = data[0];
        if (!coach) {
            throw new Error("Coach non trovato");
        }

        document.getElementById("coach-page-title").textContent = `Benvenuto nella pagina di ${coach.name} ${coach.last_name}`;

        const coachName = document.getElementById("coach-name");
        coachName.textContent = coach.name;
        const coachLastName = document.getElementById("coach-last-name");
        coachLastName.textContent = coach.last_name;

        const coachDisciplines = document.getElementById("coach-disciplines");
        coachDisciplines.replaceChildren();
        coach.categories.forEach(element => {
            const discipline = document.createElement("li");
            discipline.textContent = element;
            coachDisciplines.appendChild(discipline);
        });

        const coachPhone = document.getElementById("coach-phone-num");
        coachPhone.textContent = coach.phone;
        const coachEmail = document.getElementById("coach-email");
        coachEmail.textContent = coach.email;
        const coachRegion = document.getElementById("coach-region");
        coachRegion.textContent = coach.region;
    } catch (error) {
        console.error("Errore:", error);
    }
}

// Loading reviews into the review section
function createReviewCard(review) {
    const card = document.createElement("article");
    card.classList.add("review-card");

    const userName = document.createElement("h2");
    userName.textContent = review.user_name;

    const rating = document.createElement("p");
    rating.classList.add("review-rating");
    const stars = document.createElement("span");
    stars.setAttribute("aria-hidden", "true");
    stars.textContent = "★".repeat(Number(review.rating)) + "☆".repeat(5 - Number(review.rating));
    rating.appendChild(stars);
    rating.append(` ${review.rating}/5`);

    const [date, time] = review.meeting_date.split(" ");
    const [year, month, day] = date.split("-");
    const meetingDate = document.createElement("p");
    meetingDate.classList.add("review-meeting-date");
    meetingDate.textContent = `Incontro del ${day}/${month}/${year} alle ${time}`;

    card.appendChild(userName);
    card.appendChild(rating);
    card.appendChild(meetingDate);

    if (review.review && review.review.trim()) {
        const reviewText = document.createElement("p");
        reviewText.classList.add("review-text");
        reviewText.textContent = review.review;
        card.appendChild(reviewText);
    }

    return card;
}

async function loadCoachReviews() {
    if (!coach_id) return;

    try {
        const params = new URLSearchParams({coach_id});
        const res = await fetch(`/api/coach-reviews?${params}`);
        if (!res.ok) throw new Error("Impossibile caricare le recensioni");

        const data = await res.json();
        reviewCarosel.replaceChildren();

        if (data.totalReviews === 0) {
            reviewSummary.textContent = "Ancora nessuna recensione";
            return;
        }

        const numberOfReviews = data.totalReviews === 1 ? "recensione" : "recensioni";
        const averageRating = Number(data.averageRating).toLocaleString("it-IT", {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        });
        reviewSummary.textContent = `${data.totalReviews} ${numberOfReviews} · Voto medio: ${averageRating}/5`;

        const viewport = document.createElement("div");
        viewport.classList.add("review-viewport");
        const track = document.createElement("div");
        track.classList.add("review-track");
        viewport.appendChild(track);

        if (data.reviews.length === 1) {
            track.appendChild(createReviewCard(data.reviews[0]));
            reviewCarosel.appendChild(viewport);
            return;
        }

        const previousButton = document.createElement("button");
        previousButton.type = "button";
        previousButton.classList.add("review-arrow");
        previousButton.setAttribute("aria-label", "Recensione precedente");
        previousButton.textContent = "‹";

        const nextButton = document.createElement("button");
        nextButton.type = "button";
        nextButton.classList.add("review-arrow");
        nextButton.setAttribute("aria-label", "Recensione successiva");
        nextButton.textContent = "›";

        const lastCard = createReviewCard(data.reviews[data.reviews.length - 1]);
        lastCard.setAttribute("aria-hidden", "true");
        track.appendChild(lastCard);
        data.reviews.forEach(review => track.appendChild(createReviewCard(review)));
        const firstCard = createReviewCard(data.reviews[0]);
        firstCard.setAttribute("aria-hidden", "true");
        track.appendChild(firstCard);
        track.style.transform = "translateX(-100%)";

        reviewCarosel.appendChild(previousButton);
        reviewCarosel.appendChild(viewport);
        reviewCarosel.appendChild(nextButton);

        let currentReview = 1;
        let isMoving = false;
        let reviewTimer;

        function moveReview(direction) {
            if (isMoving) return;
            isMoving = true;
            currentReview += direction;
            track.style.transform = `translateX(-${currentReview * 100}%)`;
        }

        track.addEventListener("transitionend", event => {
            if (event.target !== track || event.propertyName !== "transform") return;

            if (currentReview === 0 || currentReview === data.reviews.length + 1) {
                currentReview = currentReview === 0 ? data.reviews.length : 1;
                track.style.transition = "none";
                track.style.transform = `translateX(-${currentReview * 100}%)`;
                track.getBoundingClientRect();
                track.style.transition = "";
            }
            isMoving = false;
        });

        function stopReviewTimer() {
            clearInterval(reviewTimer);
        }

        function startReviewTimer() {
            stopReviewTimer();
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            reviewTimer = setInterval(() => moveReview(1), 5000);
        }

        previousButton.addEventListener("click", () => moveReview(-1));
        nextButton.addEventListener("click", () => moveReview(1));
        reviewCarosel.addEventListener("mouseenter", stopReviewTimer);
        reviewCarosel.addEventListener("mouseleave", startReviewTimer);
        reviewCarosel.addEventListener("focusin", stopReviewTimer);
        reviewCarosel.addEventListener("focusout", event => {
            if (!reviewCarosel.contains(event.relatedTarget)) startReviewTimer();
        });
        startReviewTimer();
    } catch (error) {
        console.error("Errore:", error);
        reviewSummary.textContent = "Impossibile caricare le recensioni";
    }
}

// Aggiornamento della settimana e dei giorni disponibili.
function resetTimeSelection() {
    global_start_time = undefined;
    selected_time_slot = undefined;
    bookButton.classList.add("hidden2");
    time_container.replaceChildren();
}

function updateLeftArrowState() {
    const isCurrentWeek = date2 <= getLastMon();
    leftArrow.classList.toggle("not-select", isCurrentWeek);
    leftArrow.disabled = isCurrentWeek;
    selectedDaySpan.textContent = "";
}

function updateWeekAvailability() {
    updateLeftArrowState();
    const start_date = sumDays(date2, 0).split("-").reverse().join("-");
    const end_date = sumDays(date2, 6).split("-").reverse().join("-");
    return updateAvailability(start_date, end_date);
}

async function updateAvailability(startDate, endDate) {
    // Un cambio rapido di settimana annulla il caricamento precedente.
    availabilityRequest?.abort();
    availabilityRequest = new AbortController();
    const { signal } = availabilityRequest;

    resetTimeSelection();
    selected_day = undefined;
    coach_schedule = [];
    coachBooked = [];

    document.querySelectorAll('input[name="day"]').forEach(radio => {
        radio.checked = false;
        radio.disabled = true;
    });
    document.querySelectorAll(".days [data-day]").forEach(day => {
        day.classList.add("hidden2");
    });

    const formatted_text = formattedweek(startDate, endDate);
    const text_week = document.getElementById("booking-week");
    text_week.textContent = formatted_text;

    try {
        // La query usa start_at < endDate: il limite esclusivo è il lunedì
        // successivo, così comprende anche le prenotazioni di domenica.
        const date = getDateFromString(endDate + "T00:00:00");
        const params = new URLSearchParams({
            coach_id,
            startDate,
            endDate: sumDays(date, 1).split("-").reverse().join("-")
        });
        const res = await fetch(`/api/coach-dates?${params}`, { signal });
        if (!res.ok) {
            throw new Error("Impossibile caricare le disponibilità");
        }

        const data = await res.json();
        if (signal.aborted) {
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mon = getDateFromString(startDate + "T00:00:00");
        coach_schedule = data.schedule;
        coachBooked = data.booking;

        coach_schedule.forEach(day => {
            const element = document.querySelector(`[data-day="${day.day_of_week}"]`);
            if (!element) {
                return;
            }

            const date = new Date(mon);
            date.setDate(date.getDate() + Number(day.day_of_week) - 1);
            const isInvalid = date < today;

            const radio = element.querySelector('input[name="day"]');
            radio.disabled = isInvalid;
            element.querySelector("label").classList.toggle("not-select", isInvalid);
            element.classList.remove("hidden2");
        });
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }
        console.error("Errore:", error);
        setPopup("Disponibilità non caricate", "Riprova a selezionare la settimana", bookingDiv);
    }
}

// Creazione e verifica degli slot orari del giorno selezionato.
function checkForInvalidTimeSlot(start_time, end_time) {
    return coachBooked.some(booking => {
        const start_at = getDateFromString(booking.start_at);
        const end_at = getDateFromString(booking.end_at);
        return start_time < end_at && end_time > start_at;
    });
}

function renderTimeSlots() {
    resetTimeSelection();
    const time_slot = time_container;
    const today = new Date();

    coach_schedule.forEach(day => {
        if (Number(day.day_of_week) !== selected_day + 1) {
            return;
        }

        const prov_date = new Date(date2);
        const [dayy, month, year] = sumDays(prov_date, selected_day).split("-").map(Number);
        let start_time = Number(day.start_time.split(":")[0]);
        const start_minute = Number(day.start_time.split(":")[1]);
        const end_time = Number(day.end_time.split(":")[0]);
        const end_minute = Number(day.end_time.split(":")[1]);

        // L'intera ora deve rientrare nell'orario di lavoro del coach.
        while ((start_time + 1) * 60 + start_minute <= end_time * 60 + end_minute) {
            const slotStart = new Date(year, month - 1, dayy, start_time, start_minute);
            const slotEnd = new Date(year, month - 1, dayy, start_time + 1, start_minute);
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "time";
            radio.id = `time-${start_time}-${start_minute}`;

            // Più fasce lavorative possono contenere lo stesso slot.
            if (!document.getElementById(radio.id)) {
                const label = document.createElement("label");
                label.textContent = `${String(start_time).padStart(2, "0")}:${String(start_minute).padStart(2, "0")}-${String(start_time + 1).padStart(2,"0") }:${String(start_minute).padStart(2, "0")}`;
                label.id = `label-${radio.id}`;
                label.htmlFor = radio.id;

                const isInvalid = slotStart <= today || checkForInvalidTimeSlot(slotStart, slotEnd);
                radio.disabled = isInvalid;
                label.classList.toggle("not-select", isInvalid);

                time_slot.appendChild(radio);
                time_slot.appendChild(label);
            }
            start_time++;
        }
    });
}

// Invio della prenotazione selezionata.
async function bookAppointment() {
    if (!global_start_time || selected_day === undefined || bookButton.disabled) {
        return;
    }

    if (bookingNotes.value.length > 1000) {
        setPopup("Note troppo lunghe", "Inserisci al massimo 1000 caratteri", bookingDiv);
        return;
    }

    const timeVar1 = sumDays(date2, selected_day).split("-").reverse().join("-") + " " + global_start_time.split("-")[0] + ":00";
    const timeVar2 = sumDays(date2, selected_day).split("-").reverse().join("-") + " " + global_start_time.split("-")[1] + ":00";
    bookButton.disabled = true;

    try {
        const res = await fetch("/api/booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                coach_id,
                start_time: timeVar1,
                end_time: timeVar2,
                notes: bookingNotes.value.trim() || null
            })
        });

        // Il server attuale reindirizza al login se manca l'autenticazione.
        if (res.redirected) {
            window.location.replace(res.url);
            return;
        }
        if (res.status === 401) {
            window.location.replace("/public/login.html");
            return;
        }
        if (res.status === 409) {
            setPopup("Orario già prenotato", "Provare a scegliere un altro orario", bookingDiv);
            await updateWeekAvailability();
            return;
        }
        if (!res.ok) {
            throw new Error("Impossibile completare la prenotazione");
        }

        if (res.status === 201) {
            bookingNotes.value = "";
            const res_div = document.getElementById("booking-response-div");
            const res_p = document.createElement("p");
            res_p.textContent = `Prenotazione eseguita`;
            res_div.appendChild(res_p);
            await updateWeekAvailability();
        }
    } catch (error) {
        console.error("Errore:", error);
        setPopup("Prenotazione non riuscita", "Riprova tra poco", bookingDiv);
    } finally {
        bookButton.disabled = false;
    }
}

// Listener: collegano le azioni dell'utente alle funzioni sopra.
window.addEventListener("load", loadCoach);
window.addEventListener("load", loadCoachReviews);

bookOptionButton.addEventListener("click", () => {
    bookingDiv.showModal();
    date2 = getLastMon();
    updateWeekAvailability();
});

document.getElementById("close-booking-button").addEventListener("click", () => {
    bookingDiv.close();
});

leftArrow.addEventListener("click", () => {
    if (date2 <= getLastMon()) {
        return;
    }
    date2.setDate(date2.getDate() - 7);
    updateWeekAvailability();
});

document.getElementById("booking-right-arrow").addEventListener("click", () => {
    date2.setDate(date2.getDate() + 7);
    updateWeekAvailability();
    selectedDaySpan.textContent = "";
});

document.querySelectorAll('input[name="day"]').forEach(input => {
    input.addEventListener("change", event => {
        selected_day = Number(event.target.value) - 1;
        renderTimeSlots();
        let formattedDaySelected = new Date(date2);
        formattedDaySelected.setDate(formattedDaySelected.getDate() + selected_day);
        dayNumMonyear = event.target.id.charAt(0).toUpperCase() + event.target.id.slice(1) + " " + formattedDaySelected.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
        selectedDaySpan.textContent = dayNumMonyear;
        bookResponseDiv.textContent = "";
    });
});

// Gli input degli orari sono dinamici: il listener è sul contenitore.
time_container.addEventListener("change", event => {
    if (event.target.matches('input[type="radio"][name="time"]') && !event.target.disabled) {
        selected_time_slot = event.target.id;
        global_start_time = document.getElementById(`label-${selected_time_slot}`).textContent;
        bookButton.classList.remove("hidden2");
        console.log(global_start_time);
        selectedDaySpan.textContent = dayNumMonyear + " ore " + global_start_time;
    }
});

bookButton.addEventListener("click", bookAppointment);

bookingDiv.addEventListener("click", event => {
    if (event.target !== bookingDiv) return;
    const rect = bookingDiv.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
        bookingDiv.close();
    }
});
