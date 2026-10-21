const userNameField = document.getElementById("username-form");
const nameForm = document.getElementById("name-form");
const lastnameForm = document.getElementById("lastname-form");
const sexForm = document.getElementById("sex-list");
const birthdateForm = document.getElementById("birthdate-form");
const passwdForm = document.getElementById("password-form");
const confirmPasswdForm = document.getElementById("confirm-password-form");

const usernameRegex = /^[A-Za-z][A-Za-z0-9._-]{3,19}$/;
const nameRegexp = /^[A-Za-z]{1,50}$/;
const passRegexp = /^(?=.*\p{Lu})(?=.*\p{Nd})(?=.*[\p{P}\p{S}])\S{6,20}$/u;

const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

// This function show to the user, in a situation where we get http error 400 (very rare case, or we've sent the message with another client), the field(s) that failed the signin.
function showServerValidationErrors(errors, serverError) {
    const fields = [
        ["user_name", userNameField, "signin-username-verify"],
        ["name", nameForm, "signin-name-verify"],
        ["last_name", lastnameForm, "signin-lastname-verify"],
        ["sex", sexForm, "signin-sex-verify"],
        ["birth_date", birthdateForm, "signin-birthdate-verify"],
        ["password", passwdForm, "sigin-password-verify"],
        ["confirm_password", confirmPasswdForm, "sigin-confirm-password-verify"]
    ];

    let firstInvalid = null;

    for (const [key, field, feedbackId] of fields) {
        const message = errors?.[key];

        if (typeof message !== "string" || !message) continue;

        showValidation(field, feedbackId, message);

        if (!firstInvalid) firstInvalid = field;
    }

    if (firstInvalid) {
        firstInvalid.focus();
    } else {
        serverError.textContent = "Controlla i dati inseriti e riprova.";
    }
}

function updateBirthdateLimits() {
    const today = new Date();
    const yearsAgo = (years) => {
        const year = today.getFullYear() - years;
        const lastDayOfMonth = new Date(year, today.getMonth() + 1, 0).getDate();
        return formatDate(new Date(year, today.getMonth(), Math.min(today.getDate(), lastDayOfMonth)));
    };
    birthdateForm.min = yearsAgo(100);
    birthdateForm.max = yearsAgo(10);
}

function showValidation(field, feedbackId, error, success = "") {
    const feedback = document.getElementById(feedbackId);
    feedback.textContent = error || success;
    feedback.classList.toggle("text-green", !error && Boolean(success));
    if (error) {
        field.setAttribute("aria-invalid", "true");
    } else {
        field.removeAttribute("aria-invalid");
    }
    return !error;
}

function validateUsername() {
    const value = userNameField.value;
    const error = !value.trim() ? "Il nome utente è obbligatorio." :
        !usernameRegex.test(value) ? "Nome utente non valido: usa 4-20 caratteri, iniziando con una lettera." : "";
    return showValidation(userNameField, "signin-username-verify", error, "Nome utente valido!");
}

function validateName() {
    const value = nameForm.value;
    const error = !value.trim() ? "Il nome è obbligatorio." :
        !nameRegexp.test(value) ? "Il nome deve contenere da 1 a 50 lettere." : "";
    return showValidation(nameForm, "signin-name-verify", error);
}

function validateLastname() {
    const value = lastnameForm.value;
    const error = !value.trim() ? "Il cognome è obbligatorio." :
        !nameRegexp.test(value) ? "Il cognome deve contenere da 1 a 50 lettere." : "";
    return showValidation(lastnameForm, "signin-lastname-verify", error);
}

function validateSex() {
    const error = sexForm.value === "maschio" || sexForm.value === "femmina" ? "" : "Seleziona il sesso.";
    return showValidation(sexForm, "signin-sex-verify", error);
}

function validateBirthdate() {
    updateBirthdateLimits();
    const value = birthdateForm.value;
    const error = !value ? "La data di nascita è obbligatoria." :
        birthdateForm.validity.badInput || value < birthdateForm.min || value > birthdateForm.max ?
            "L'età deve essere compresa tra 10 e 100 anni." : "";
    return showValidation(birthdateForm, "signin-birthdate-verify", error);
}

function validatePassword() {
    const value = passwdForm.value;
    const error = !value ? "La password è obbligatoria." :
        !passRegexp.test(value) ? "Password non valida: controlla le regole indicate." : "";
    return showValidation(passwdForm, "sigin-password-verify", error, "Password valida!");
}

function validateConfirmPassword() {
    const value = confirmPasswdForm.value;
    const error = !value ? "Conferma la password." :
        value !== passwdForm.value ? "Le password non coincidono." : "";
    return showValidation(confirmPasswdForm, "sigin-confirm-password-verify", error);
}

updateBirthdateLimits();

userNameField.addEventListener("input", validateUsername);
nameForm.addEventListener("input", validateName);
lastnameForm.addEventListener("input", validateLastname);
sexForm.addEventListener("change", validateSex);
birthdateForm.addEventListener("change", validateBirthdate);
passwdForm.addEventListener("input", () => {
    validatePassword();
    if (confirmPasswdForm.value) validateConfirmPassword();
});
confirmPasswdForm.addEventListener("input", validateConfirmPassword);

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

const signinForm = document.getElementById("form-signin");
signinForm.addEventListener("submit", async function(event){
    event.preventDefault();
    const checks = [
        [userNameField, validateUsername],
        [nameForm, validateName],
        [lastnameForm, validateLastname],
        [sexForm, validateSex],
        [birthdateForm, validateBirthdate],
        [passwdForm, validatePassword],
        [confirmPasswdForm, validateConfirmPassword]
    ];
    let firstInvalid = null;

    for (const [field, validate] of checks) {
        if (!validate() && !firstInvalid) firstInvalid = field;
    }

    if (firstInvalid) {
        firstInvalid.focus();
        return;
    }

    const params = {
        user_name: userNameField.value,
        name: nameForm.value,
        last_name: lastnameForm.value,
        sex: sexForm.value,
        birth_date: birthdateForm.value,
        password: passwdForm.value,
        confirm_password: confirmPasswdForm.value
    };
    
    const serverError = document.getElementById("signin-alert-error");
    serverError.textContent = '';

    try {
        const res = await fetch("/api/signin", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(params)
        });

        
        if (res.status >= 500) {
            serverError.textContent = "Non siamo riusciti a completare la registrazione. Riprova più tardi.";
            return;
        }

        const data = await res.json();

        if (res.status === 400){
            showServerValidationErrors(data.errors, serverError);
            return;
        }

        if (res.status === 409){
            showValidation(userNameField, "signin-username-verify", data.error);
            userNameField.focus();
            return;
        }
        
        if (data.success){
            window.location.replace("/private/new_profile.html");
            return;
        }


           
    } catch (error) {
        console.log("Errore:",error);
        serverError.textContent = error;
    }

});
