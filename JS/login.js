document.getElementById("login-button").addEventListener("click", async function(event){
    event.preventDefault();
    const user_name = document.getElementById("username-form").value;
    const password = document.getElementById("password-form").value;
    const textError = document.getElementById("login-text-error");
    textError.textContent = "";
    if (!user_name || !password){
        document.getElementById("login-text-error").textContent = "Formato non valido!";
        return;
    }
    const utente = {
        username: user_name,
        password: password
    };
    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(utente)
        })  

        const data = await res.json();

        if (data.success == true){
            window.location.replace("/private/new_profile.html");
            return;
        }else{
        textError.textContent = data.error;
        }
    } catch (error) {
        document.getElementById("login-text-error").textContent = "Non e possibile accedere alla piattaforma attualmente";
        console.log(error);
    }
})
