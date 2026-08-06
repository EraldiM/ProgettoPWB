window.addEventListener("load", async function(event){
    try {
        const res = await fetch("/GET/profile", {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await res.json();
        let user = data[0];
        document.getElementById("profile-user-name").textContent = user.user_name;
        const icon = document.createElement("i");
        const button = document.createElement("button");
        button.classList.add("modify-container");
        button.append(icon);
        icon.classList.add("fa-solid", "fa-pencil");
        document.getElementById("profile-user-name").appendChild(button);
        document.getElementById("profile-name").textContent = user.name;
        document.getElementById("profile-last-name").textContent = user.last_name;
        document.getElementById("profile-age").textContent = new Date().getFullYear() - parseInt(user.birth_date.split("-")[0]) + " anni";
        document.getElementById("profile-sex").textContent = user.sex ? "Maschio" : "Femmina";
        document.getElementById("profile-subscription-date").textContent = user.creation_date.slice(0,10);
    } catch (error) {
        console.log(error);
    }
});
