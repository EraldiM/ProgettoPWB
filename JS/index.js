
function addCoachCardToMapDiv(name, disciplines, id, parentDiv){
    let coach_card_div = document.createElement("div");
    coach_card_div.classList.add("home-region-coach-card");
    let anchor = document.createElement("a");
    let param = new URLSearchParams({coach_id: id})
    console.log(id);
    anchor.href = `/public/coach?${param}`;
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
    parentDiv.appendChild(coach_card_div);
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

// This function Handles clicks on states map
// This function is provided by countrymap.js

simplemaps_countrymap.hooks.preclick_state = async function (id, event) {
    const region = simplemaps_countrymap_mapdata.state_specific[id]?.name;
    let coach_div_container = document.getElementById("map-coach-res");
    let param = new URLSearchParams({region})
    console.log(param);
    try {
        const res = await fetch(`/api/region-coaches?${param}`);

        const data = await res.json();
        console.log(data);

        coach_div_container.innerHTML = '';
        data.forEach((coach) =>{
            addCoachCardToMapDiv(`${coach.name} ${coach.last_name}`, coach.categories, coach.id, coach_div_container);
        });

    } catch (error) {
        console.log("Error:", error);
    }
};


