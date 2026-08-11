let last_coach_id;
const discipline_list = document.getElementById("discipline-list");
let tag_selected = false; // this variable represents the discipline that the user has selected, by the fault its value false, a state that represents all possible disciplines.
const notFound = document.querySelector(".not-found");

function createPopup(){
    let popupDiv = document.createElement("div");
    popupDiv.classList.add("pop-up");
    popupDiv.classList.add("hidden2");
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
    popUp.offsetHeight;
    popUp.classList.remove("hidden2");
    popUp.addEventListener("transitionend", (event)=>{
        if (event.propertyName=== "opacity"){
            popUp.classList.add("line");
        }
    }), {once: true};
    popUp.addEventListener("animationend", (event)=>{
        if(event.animationName == "expandLine"){
            popUp.classList.add("hidden2");
        }
        popUp.addEventListener("transitionend", (event)=>{
            if (event.propertyName=== "opacity"){
                popUp.remove();
            }
        }), {once: true};
    });

}

window.addEventListener("load", async function(){
    const data = await fetch("/GET/disciplines");

    const res = await data.json();
    res.forEach(ele=> {
        let discipline = document.createElement("li");
        discipline.textContent = ele.category_name;
        discipline.classList.add("discipline");
        discipline_list.appendChild(discipline);
    });

});

window.addEventListener("load", async function(){
    const data = await fetch("/GET/coach-list");

    const res = await data.json();
    const coach_div = document.getElementById("coaches-result");
    res.forEach(ele => {
        let discipline_container = document.createElement("div");
        discipline_container.id = "discipline-tag-container";
        name_last_name = document.createElement("a");
        name_last_name.href = "asdhnsfidjugbhn.html";
        coach_container = document.createElement("div");
        name_last_name.textContent = ele.name + " " + ele.last_name;
        coach_container.classList.add("coach-card");
        coach_div.appendChild(coach_container);
        coach_container.append(name_last_name);
        ele.categories.forEach(category => {
            categoryDOM = document.createElement("span");
            categoryDOM.classList.add("discipline-tag");
            categoryDOM.textContent = category;
            discipline_container.appendChild(categoryDOM);
        });
        coach_container.appendChild(discipline_container);
    });
    last_coach_id = res[res.length - 1].id;
});

const icon = document.getElementById("triangle");
const button = document.getElementById("discipline-button");
const disciplineList = document.getElementById("discipline-list");
icon.classList.toggle("triangle-trans");
disciplineList.classList.toggle("hidden");

document.getElementById("discipline-button").addEventListener("click", async function(){
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
            setPopUp(title, description, document.getElementById("more-coaches-div"));
            return;
        }
        const coach_div = document.getElementById("coaches-result");
        res.forEach(ele => {
            let discipline_container = document.createElement("div");
            discipline_container.id = "discipline-tag-container";
            name_last_name = document.createElement("a");
            name_last_name.href = "asdhnsfidjugbhn.html";
            coach_container = document.createElement("div");
            name_last_name.textContent = ele.name + " " + ele.last_name;
            coach_container.classList.add("coach-card");
            coach_div.appendChild(coach_container);
            coach_container.append(name_last_name);
            ele.categories.forEach(category => {
                categoryDOM = document.createElement("span");
                categoryDOM.classList.add("discipline-tag");
                categoryDOM.textContent = category;
                discipline_container.appendChild(categoryDOM);
            });
        coach_container.appendChild(discipline_container);
        });
        last_coach_id = res[res.length - 1].id;
    } catch (error) {
        console.log("erroreeee: " + error);
    }
});

document.getElementById("search-button-coaches").addEventListener("click", async function(){
    let coach_name = document.getElementById("search-coach-name").value;
    const old_tag = tag_selected;
    tag_selected = document.getElementById("discipline-text").textContent;
    if (tag_selected == "Disciplina"){
        alert("Scegliere una disciplina.");
        return;
    }
    const params = new URLSearchParams({
        coach_name: coach_name,
        discipline: tag_selected
    });
    try {
        const data = await fetch(`/GET/filtered-coach?${params}`,{
            method: 'GET'
        });
    
        const res = await data.json();
        // console.log(data.length);
        if (res.length == 0){
        console.log(res.length);
            let titolo = "Nessun coach trovato.";
            let descrizione = "Provare un altro nome o un altra disciplina."
            setPopUp(titolo, descrizione, document.getElementById("explore-div"));
            tag_selected = old_tag;
            return;
        }

        const coach_div = document.getElementById("coaches-result");
        coach_div.innerHTML = "";
        res.forEach(ele => {
            let discipline_container = document.createElement("div");
            discipline_container.id = "discipline-tag-container";
            name_last_name = document.createElement("a");
            name_last_name.href = "asdhnsfidjugbhn.html";
            coach_container = document.createElement("div");
            name_last_name.textContent = ele.name + " " + ele.last_name;
            coach_container.classList.add("coach-card");
            coach_div.appendChild(coach_container);
            coach_container.append(name_last_name);
            ele.categories.forEach(category => {
                categoryDOM = document.createElement("span");
                categoryDOM.classList.add("discipline-tag");
                categoryDOM.textContent = category;
                discipline_container.appendChild(categoryDOM);
            });
        coach_container.appendChild(discipline_container);
        });
        last_coach_id = res[res.length - 1].id;
         
    } catch (error) {

    }
});
