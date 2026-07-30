document.getElementById("signup").addEventListener("click", async function(event){
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirm_password = document.getElementById("password2").value;
    const name = document.getElementById("name").value;
    const last_name = document.getElementById("last_name").value;
    const sex = parseInt(document.getElementById("sex-select").value);
    const soloLettere = /^\p{L}+$/u;
    
    if(!username || !password || !confirm_password || !name || !last_name || !sex){
        alert("Formato non valido");
        document.getElementById("signup-error").textContent = "Formato non valido";
        return;
    }

    if(!isNaN(username)){
        alert("Il nome utente non può contenere solo numeri");
        console.log("Il nome utente non può contenere solo numeri");
        document.getElementById("signup-error").textContent = "Il nome utente non può contenere solo numeri ";
        return;
    }

    if(!soloLettere.test(name)){
        document.getElementById("signup-error").textContent = "Il nome inserito non è valido, il nome deve contenere solo lettere";
        return;
    }

    if(!soloLettere.test(last_name)){
        document.getElementById("signup-error").textContent = "Il cognome inserito non è valido, sono consentite solo lettere";
        return;
    }

    if(password.length < 6 || username.lenth < 6){
        document.getElementById("signup-error").textContent = "Il nome utente e la password devono avere almeno 5 caratteri";
        return;
    }

    if(password != confirm_password){
        document.getElementById("signup-error").textContent = "Assicurati che le password coincidano!";
        return;
    }

    let utente = {
        username: username,
        password: password,
        name: name,
        last_name: last_name,
        sex: sex
    };

    try {
        const res = await fetch("/signup", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(utente)
        });

        const data = await res.json();
        let risposta = data.message;
        console.log(risposta);
    } catch (error) {
        console.log("Errore nella richiesta: " + error);
    }
    
});
