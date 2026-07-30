document.getElementById("login").addEventListener("click", async function(event){
    event.preventDefault();
    const user_name = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    if (!user_name || !password){
        document.getElementById("login-text-error").textContent = "Formato non valido!";
    }
    const utente = {
        username: user_name,
        password: password
    };
    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(utente)
        })  

        const data = await res.json();
        let message = data.message;
        console.log(message);
    } catch (error) {
        document.getElementById("login-text-error").textContent = "Nome utente o password non corretti!";
        console.log(error);
    }
})
