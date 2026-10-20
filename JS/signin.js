const userNameField = document.getElementById("username-form");
userNameField.addEventListener("input", (event) =>{
    // We have a REGEXP that checks if the username is valid or not. Valide usernames are: Char + Char/Num/special char (max len: 20, min len:6)
    const usernameRegex = /^[A-Za-z][A-Za-z0-9._-]{3,19}$/;
    const verify = document.querySelector("#signin-username-verify");
    let usrname = event.target.value;
    if(usernameRegex.test(usrname)){
        verify.classList.add("text-green");
        verify.textContent = "Nome utente valido!"
        return;
    }
    verify.classList.remove("text-green");
    verify.textContent = "Nome utente non valido!"
    
});

const nameForm = document.getElementById("name-form");
nameForm.addEventListener("input", (event)=>{

    const nameRegexp = /^[A-Za-z]{1,50}$/;
    let name = event.target.value;

    if(nameRegexp.test(name)){
        console.log("nome valido");
    }
});

const lastnameForm = document.getElementById("lastname-form");
lastnameForm.addEventListener("input", (event)=>{

    const nameRegexp = /^[A-Za-z]{1,50}$/;
    let name = event.target.value;

    if(nameRegexp.test(name)){
        console.log("nome valido");
    }
});

const passwdForm = document.getElementById("password-form");
passwdForm.addEventListener("input", (event)=>{
    const passRegexp = /^(?=.*\p{Lu})(?=.*\p{Nd})(?=.*[\p{P}\p{S}])\S{6,20}$/u;
    let passwrd = event.target.value;
        
    if (passRegexp.test(passwrd)) {
        console.log("password valida");
        return;
    }
    console.log("pw non valida");


});

const confirmPasswdForm = document.getElementById("confirm-password-form");
confirmPasswdForm.addEventListener("input", (event)=>{
    const verify = document.getElementById("sigin-confirm-password-verify");
    if (event.target.value.length == passwdForm.value.length && event.target.value != passwdForm.value){
        verify.textContent = "Le password non coincidono";
    }else{
        verify.textContent = "";
    }
})

function setRuleDiv() {
    const form = document.querySelector("#signin-div form");
    const usrNameIcon = document.querySelector("#signin-username-div .fa-info");
    const usrNameRule = document.querySelector("#user-name-rule-div");
    const pwIcon = document.querySelector("#signin-password-div .fa-info");
    const pwRule = document.querySelector("#password-rule-div");

    const formRect = form.getBoundingClientRect();
    const uIconRect = usrNameIcon.getBoundingClientRect();
    const pwIconRect = pwIcon.getBoundingClientRect();

    usrNameRule.style.left = `${uIconRect.right - formRect.left + 8}px`;
    usrNameRule.style.top = `${uIconRect.top - formRect.top - 60}px`;

    pwRule.style.left = `${pwIconRect.right - formRect.left + 8}px`;
    pwRule.style.top = `${pwIconRect.top - formRect.top - 60}px`;
}

setRuleDiv();

document.querySelector("#username-info-span").addEventListener("mouseenter", ()=>{
    let rule_div = document.getElementById("user-name-rule-div");
    rule_div.classList.remove("hidden");
});

document.querySelector("#username-info-span").addEventListener("mouseleave", ()=>{
    let rule_div = document.getElementById("user-name-rule-div");
    rule_div.classList.add("hidden");
});

document.querySelector("#password-info-span").addEventListener("mouseenter", () => {
    document.querySelector("#password-rule-div").classList.remove("hidden");
});

document.querySelector("#password-info-span").addEventListener("mouseleave", () => {
    document.querySelector("#password-rule-div").classList.add("hidden");
});
