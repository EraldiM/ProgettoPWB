
import { createSpinner, sleep } from "./utils.js";

const mapCoachRes = document.getElementById("map-coach-res");
const mapCoachSentinel = document.getElementById("map-coach-sentinel");
let selectedMapRegion;
let lastMapCoachId = 0;
let loadingMapCoaches = false;
let hasMoreMapCoaches = false;
let mapCoachRequest;

function addCoachCardToMapDiv(name, disciplines, id, parentDiv){
    let coach_card_div = document.createElement("div");
    coach_card_div.classList.add("home-region-coach-card");
    let anchor = document.createElement("a");
    let param = new URLSearchParams({coach_id: id})
    console.log(id);
    anchor.href = `/public/new_coach.html?${param}`;
    let span_a = document.createElement("span");
    anchor.appendChild(span_a);
    span_a.textContent = name;
    coach_card_div.appendChild(anchor);

    let disciplines_p = document.createElement("p");
    disciplines_p.classList.add("home-coach-card-disciplines");
    disciplines.forEach((discipline) =>{
        let discipline_span = document.createElement("span");
        discipline_span.textContent = discipline;
        disciplines_p.appendChild(discipline_span);
    });
    coach_card_div.appendChild(disciplines_p);
    parentDiv.insertBefore(coach_card_div, mapCoachSentinel);
    return;
}

document.querySelectorAll(".div-image-container").forEach((container) =>{
    let idx = 0;

    container.querySelectorAll(".right-arrow").forEach((ele)=>{ let img_container = ele.closest(".div-image-container");
        let imgs = img_container.querySelectorAll(":scope > img");
        ele.addEventListener("click", () =>{
            
            idx = (idx + 1) % imgs.length;
            console.log(idx * 100);
            imgs.forEach((img) =>{
            img.style.transform = `translateX(-${idx * 100}%)`;
            });
        });
    });


    container.querySelectorAll(".left-arrow").forEach((ele)=>{
        let img_container = ele.closest(".div-image-container");
        let imgs = img_container.querySelectorAll(":scope > img");

        ele.addEventListener("click", () =>{

            idx = (idx - 1 + imgs.length) % imgs.length;
            console.log(idx * 100);
            imgs.forEach((img) =>{
            img.style.transform = `translateX(-${idx * 100}%)`;
            });
        });
    });
})

async function loadMoreMapCoaches(){
    if (loadingMapCoaches || !hasMoreMapCoaches || !selectedMapRegion) return;

    loadingMapCoaches = true;
    mapCoachObserver.unobserve(mapCoachSentinel);
    const request = new AbortController();
    mapCoachRequest = request;

    const spinner = createSpinner("Caricamento coach");
    mapCoachSentinel.appendChild(spinner);

    const params = new URLSearchParams({
        region: selectedMapRegion,
        coach_id: lastMapCoachId
    });

    try {
        const [res] = await Promise.all([
            fetch(`/api/region-coaches?${params}`, {signal: request.signal}),
            sleep(1000)
        ]);
        if (!res.ok) throw new Error("Impossibile caricare i coach");

        const data = await res.json();
        if (request.signal.aborted) return;

        data.forEach((coach) =>{
            addCoachCardToMapDiv(`${coach.name} ${coach.last_name}`, coach.categories, coach.id, mapCoachRes);
        });

        if (data.length > 0) lastMapCoachId = data[data.length - 1].id;

        if (data.length < 5){
            hasMoreMapCoaches = false;
            const noMoreCoaches = document.createElement("p");
            noMoreCoaches.textContent = "Nessun altro coach è stato trovato";
            mapCoachSentinel.appendChild(noMoreCoaches);
        }
    } catch (error) {
        if (request.signal.aborted) return;
        hasMoreMapCoaches = false;
        console.log("Error:", error);
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Impossibile caricare i coach. Seleziona di nuovo la regione per riprovare.";
        mapCoachSentinel.appendChild(errorMessage);
    } finally {
        spinner.remove();
        if (mapCoachRequest === request){
            loadingMapCoaches = false;
            if (hasMoreMapCoaches) mapCoachObserver.observe(mapCoachSentinel);
        }
    }
}

const mapCoachObserver = new IntersectionObserver((entries) =>{
    if (entries[0].isIntersecting) loadMoreMapCoaches();
},{
    root: mapCoachRes,
    rootMargin: "0px 0px 0px 0px"
});

// This function handles clicks on states and is provided by countrymap.js.
simplemaps_countrymap.hooks.preclick_state = async function (id, event) {
    const region = simplemaps_countrymap_mapdata.state_specific[id]?.name;
    if (!region) return;

    mapCoachRequest?.abort();
    mapCoachObserver.disconnect();
    selectedMapRegion = region;
    lastMapCoachId = 0;
    loadingMapCoaches = false;
    hasMoreMapCoaches = true;
    mapCoachSentinel.replaceChildren();
    mapCoachRes.replaceChildren(mapCoachSentinel);
    mapCoachRes.scrollTop = 0;

    await loadMoreMapCoaches();
};
