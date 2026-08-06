let last_coach_id;
const discipline_list = document.getElementById("discipline-list");

window.addEventListener("load", async function(){
    const data = await fetch("/GET/disciplines");

    const res = await data.json();
    console.log(res);
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
        name_last_name = document.createElement("a");
        name_last_name.href = "asdhnsfidjugbhn.html";
        coach_container = document.createElement("div");
        name_last_name.textContent = ele.name + " " + ele.last_name;
        coach_container.classList.add("coach-card");
        coach_div.appendChild(coach_container);
        coach_container.append(name_last_name);
    });
    last_coach_id = res[res.length - 1].id;
    console.log(last_coach_id);
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
    console.log(last_coach_id);
    let coach_id = new URLSearchParams({
        coach_id: last_coach_id
    });
    try {
        const data = await fetch(`/GET/more-coaches?${coach_id}`, {
            method: "GET",
        }) 
        
        const res = await data.json();
        const coach_div = document.getElementById("coaches-result");
        res.forEach(ele => {
            name_last_name = document.createElement("a");
            name_last_name.href = "asdhnsfidjugbhn.html";
            coach_container = document.createElement("div");
            name_last_name.textContent = ele.name + " " + ele.last_name;
            coach_container.classList.add("coach-card");
            coach_div.appendChild(coach_container);
            coach_container.append(name_last_name);
        });
        last_coach_id = res[res.length - 1].id;
    } catch (error) {
        console.log("erroreeee: " + error);
    }
});
