let last_coach_id;
const discipline_list = document.getElementById("discipline-list");
const discipline_summary = ["Disciplina"];
// this variable represents the discipline that the user has selected, by the fault its value false, a state that represents all possible disciplines.
let tag_selected = false; 
const notFound = document.querySelector(".not-found");

function createPopup(){
    if(document.querySelector(".pop-up")){return;}
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
    let popUp = createPopup();
    let title = document.createElement("h1");
    title.textContent = titleText;
    let paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    popUp.appendChild(title);
    popUp.appendChild(paragraph);
    containerToAppend.insertBefore(popUp, containerToAppend.firstChild);

}

function createCoachCard(fullName, disciplines, id){
    const coach_div = document.getElementById("coaches-result");
    let discipline_container = document.createElement("div");
    discipline_container.classList.add("discipline-tag-container");
    name_last_name = document.createElement("p");
    const param = new URLSearchParams({
        coach_id: id
    });
    coach_container_a = document.createElement("a");
    coach_container_a.classList.add("coach-card-anchor");
    coach_container_a.href = `/public/coach.html?${param}`;
    coach_container = document.createElement("div");
    name_last_name.textContent = fullName;
    coach_container.classList.add("coach-card");
    coach_container_a.appendChild(coach_container);
    coach_div.appendChild(coach_container_a);
    coach_container.append(name_last_name);
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
        let discipline = document.createElement("li");
        discipline.textContent = ele.category_name;
        discipline.classList.add("discipline");
        discipline_list.appendChild(discipline);
        discipline_summary.push(ele.category_name);
    });
});

window.addEventListener("load", async function(){
    const data = await fetch("/api/coach-list");

    const res = await data.json();
    res.forEach(ele => {
        createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id)
    });
    last_coach_id = res[res.length - 1].id;
    console.log(last_coach_id);
});

const icon = document.getElementById("triangle");
const button = document.getElementById("filter-discipline-button");
const disciplineList = document.getElementById("discipline-list");

document.getElementById("filter-discipline-button").addEventListener("click", async function(){
    icon.classList.toggle("triangle-trans");
    disciplineList.classList.toggle("hidden");
    disciplineList.classList.toggle("open");
});

document.getElementById("discipline-list").addEventListener("click", function(event){
    icon.classList.remove("triangle-trans");
    disciplineList.classList.add("hidden");
    disciplineList.classList.remove("open");
    document.getElementById("discipline-text").textContent = event.target.textContent;
});

document.addEventListener("click", function(event){
    if (!button.contains(event.target) && !disciplineList.contains(event.target)) {
        icon.classList.remove("triangle-trans");
        disciplineList.classList.add("hidden");
        disciplineList.classList.toggle("open");
    }
});

document.getElementById("get-more-coaches").addEventListener("click", async function(){

    let params = new URLSearchParams({
        coach_id: last_coach_id,
        discipline: tag_selected
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
        const coach_div = document.getElementById("coaches-result");
        res.forEach(ele => {
            createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id)
        });
        last_coach_id = res[res.length - 1].id;
        console.log(last_coach_id);
    } catch (error) {
        console.log("erroreeee: " + error);
    }
});

document.getElementById("filter-search-button-coaches").addEventListener("click", async function(){
    const old_tag = tag_selected;
    const name = document.getElementById("filter-search-coach-name").value || '';
    const discipline = document.getElementById("discipline-text").textContent;
    tag_selected = discipline;
    if(!discipline_summary.includes(discipline)){
        console.log("Disciplina inserita non valida");
        return;
    }

    const params = new URLSearchParams({
        coach_id: 0,
        coach_name: name,
        discipline: tag_selected
    });

    try {
        const data = await fetch(`/api/filtered-coach?${params}`,{
            method: 'GET'
        });
    
        const res = await data.json();
        if (res.length == 0){
            tag_selected = old_tag;
            let titolo = "Nessun coach trovato.";
            let descrizione = "Provare un altro nome o un altra disciplina."
            setPopUp(titolo, descrizione, document.getElementById("explore-div"));
            return;
        }

        const coach_div = document.getElementById("coaches-result");
        coach_div.innerHTML = "";
        res.forEach(ele => {
            createCoachCard(ele.name + " " + ele.last_name,ele.categories, ele.id)
        });
        last_coach_id = res[res.length - 1].id;
         
    } catch (error) {

    }
});
