let last_coach_id;
let last_coach_name = '';
const discipline_list = document.getElementById("discipline-list");
const region_list = document.getElementById("region-list");
// this variable represents the discipline that the user has selected, by the fault its value false, a state that represents all possible disciplines.
let tag_selected = ''; 
let region_selected = '';
const notFound = document.querySelector(".not-found");

function createPopup(){
    let popupDiv = document.createElement("div");
    popupDiv.classList.add("pop-up");
    // We make sure that the browser first render the pop-up and then we give to then div the other class.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            popupDiv.classList.add("pop-up-transform"); 

            setTimeout(() => {
                popupDiv.addEventListener("transitionend", () => {
                    popupDiv.remove(); // Rimosso dopo la risalita
              }, { once: true });

              popupDiv.classList.remove("pop-up-transform"); // Risale
        }, 3000);
    });
});
    return popupDiv;
}

function removePopup(popUp){
    popUp.remove();
}

function setPopUp(titleText, paragraphText, containerToAppend){
    if(document.querySelector(".pop-up")){return;}
    let popUp = createPopup();
    let title = document.createElement("h1");
    title.textContent = titleText;
    let paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    popUp.appendChild(title);
    popUp.appendChild(paragraph);
    containerToAppend.insertBefore(popUp, containerToAppend.firstChild);

}

function createCoachCard(fullName, disciplines, id, region){
    const coach_div = document.getElementById("coaches-result");
    let discipline_container = document.createElement("div");
    discipline_container.classList.add("discipline-tag-container");
    let name_last_name = document.createElement("p");
    name_last_name.classList.add("coach-fullname");
    let region_p = document.createElement("p");
    region_p.textContent = region;
    region_p.id = "coach-region";
    const param = new URLSearchParams({
        coach_id: id
    });
    coach_container_a = document.createElement("a");
    coach_container_a.classList.add("coach-card-anchor");
    coach_container_a.href = `/public/new_coach.html?${param}`;
    coach_container = document.createElement("div");
    name_last_name.textContent = fullName;
    coach_container.classList.add("coach-card");
    coach_container_a.appendChild(coach_container);
    coach_div.appendChild(coach_container_a);
    coach_container.append(name_last_name);
    coach_container.appendChild(region_p);
    disciplines.forEach(category => {
        categoryDOM = document.createElement("span");
        categoryDOM.classList.add("discipline-tag");
        categoryDOM.textContent = category;
        discipline_container.appendChild(categoryDOM);
    });
    coach_container.appendChild(discipline_container);
}

window.addEventListener("load", async function(){
    const data = await fetch("/api/disciplines");

    const res = await data.json();
    
    res.forEach(ele=> {
        let discipline = document.createElement("option");
        discipline.value = ele.category_name;
        discipline.textContent = ele.category_name;
        discipline_list.appendChild(discipline);
    });
});

window.addEventListener("load", async function(){
    try {
        const data = await fetch("/api/regions");
        if (!data.ok) throw new Error("Impossibile caricare le regioni");

        const res = await data.json();
        res.forEach(ele => {
            let region = document.createElement("option");
            region.value = ele.region;
            region.textContent = ele.region;
            region_list.appendChild(region);
        });
    } catch (error) {
        console.log("Error:" + error);
        setPopUp("Regioni non caricate", "Riprova a caricare la pagina", document.getElementById("explore-div"));
    }
});

window.addEventListener("load", async function(){
    const data = await fetch("/api/coach-list");

    const res = await data.json();
    res.forEach(ele => {
        console.log(ele);
        createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id, ele.region)
    });
    last_coach_id = res[res.length - 1].id;
});

document.getElementById("get-more-coaches").addEventListener("click", async function(){

    let params = new URLSearchParams({
        coach_id: last_coach_id,
        coach_name: last_coach_name,
        discipline: tag_selected,
        region: region_selected
    });
    
    try {
        const data = await fetch(`/GET/more-coaches?${params}`, {
            method: "GET",
        }) 

        
        const res = await data.json();
        if (res.length == 0){
            let title = "Nessun altro coach è stato trovato";
            let description = "" ;
            setPopUp(title, description, document.getElementById("explore-div"));
            return;
        }
        res.forEach(ele => {
            console.log(ele);
            createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id, ele.region)
        });
        last_coach_id = res[res.length - 1].id;
    } catch (error) {
        console.log("Error:" + error);
    }
});

document.getElementById("filter-search-button-coaches").addEventListener("click", async function(){
    const old_tag = tag_selected;
    const old_region = region_selected;
    const old_last_coach_id = last_coach_id;
    const old_last_coach_name = last_coach_name;
    last_coach_id = 0;
    last_coach_name = document.getElementById("filter-search-coach-name").value || '';
    tag_selected = discipline_list.value;
    region_selected = region_list.value;

    const params = new URLSearchParams({
        coach_id: 0,
        coach_name: last_coach_name,
        discipline: tag_selected,
        region: region_selected
    });

    try {
        const data = await fetch(`/api/filtered-coach?${params}`,{
            method: 'GET'
        });
        if (!data.ok) throw new Error("Impossibile cercare i coach");
    
        const res = await data.json();
        if (res.length == 0){
            tag_selected = old_tag;
            region_selected = old_region;
            last_coach_name = old_last_coach_name;
            last_coach_id = old_last_coach_id;
            let titolo = "Nessun coach trovato.";
            let descrizione = "Provare un altro nome, un'altra disciplina o un'altra regione."
            setPopUp(titolo, descrizione, document.getElementById("explore-div"));
            return;
        }

        const coach_div = document.getElementById("coaches-result");
        coach_div.innerHTML = "";
        res.forEach(ele => {
            createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id, ele.region)
        });
        last_coach_id = res[res.length - 1].id;
         
    } catch (error) {
        tag_selected = old_tag;
        region_selected = old_region;
        last_coach_name = old_last_coach_name;
        last_coach_id = old_last_coach_id;
        console.log("Error:" + error);
        setPopUp("Ricerca non riuscita", "Riprova tra poco", document.getElementById("explore-div"));
    }
});
