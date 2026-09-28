window.addEventListener("load", async function(event){
    try {
        const res = await fetch("/GET/profile", {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await res.json();
        let user = data[0];
        document.getElementById("profile-user-name").textContent = user.user_name;
        document.getElementById("profile-name").textContent = user.name;
        document.getElementById("profile-last-name").textContent = user.last_name;
        document.getElementById("profile-age").textContent = new Date().getFullYear() - parseInt(user.birth_date.split("-")[0]) + " anni";
        document.getElementById("profile-sex").textContent = user.sex ? "Maschio" : "Femmina";
        document.getElementById("profile-subscription-date").textContent = user.creation_date.slice(0,10);
    } catch (error) {
        console.log(error);
    }
});

document.getElementById("change-name").addEventListener("click", function(){
    let u_name_span= document.getElementById("profile-user-name");
    let u_name = u_name_span.textContent;
    u_name_span.innerHTML = "";
    let text_field = document.createElement("input");
    text_field.type = "text";
    text_field.id = "change-name-input";
    text_field.name = "name";
    text_field.required
    text_field.value = u_name;
    document.getElementById("profile-user-name").appendChild(text_field);
    document.getElementById("change-name").hidden = true;
    document.getElementById("submit-change-name-button").hidden = false;
});

function changeErrorSpan(message, errorSpan, parentElment){

    errorSpan.textContent = message;
    errorSpan.classList.add("error-message-change-uname");
    parentElment.appendChild(errorSpan);
    let old_error_span = document.getElementById("change-name-error");
    if(old_error_span){
        old_error_span.remove();
    }
    errorSpan.id = "change-name-error";
    return errorSpan;
}

document.getElementById("submit-change-name-button").addEventListener("click", async function(){
    let new_uname = document.getElementById("change-name-input").value;
    let profile_user_name = document.getElementById("profile-user-name");
    let errorSpan = document.createElement("span");
    var usernameRegex = /^[a-zA-Z0-9_]+$/;
    //
    // Using regexp to check for a valid username
    if(!new_uname || !usernameRegex.test(new_uname)){
        changeErrorSpan("*Nome non valido", errorSpan, profile_user_name);
        return;
    }else if(!/[a-zA-Z]/.test(new_uname)){
        changeErrorSpan("*Il nome utente deve contenere delle lettere", errorSpan, profile_user_name);
    }

    new_uname = JSON.stringify({
        user_name: new_uname
    });

    try {
        const res = await fetch("/user-name", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: new_uname
        });

        const data = await res.json();

        console.log(data.error);
        console.log(data);
        if (data.error){
            changeErrorSpan(data.error, errorSpan, profile_user_name);
            return;
        }

        return window.location.reload();

    } catch (error) {
        console.log("Errore:", error);
    }

});
