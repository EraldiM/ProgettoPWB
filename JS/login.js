document.getElementById("login-button").addEventListener("click", async function(event){
    event.preventDefault();
    const user_name = document.getElementById("username-form").value;
    const password = document.getElementById("password-form").value;
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
        }
    } catch (error) {
        document.getElementById("login-text-error").textContent = "Nome utente o password non corretti!";
        console.log(error);
    }
})
