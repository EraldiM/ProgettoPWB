const user_name_field = document.getElementById("username-form");
user_name_field.addEventListener("input", (event) =>{
    // We have a REGEXP that checks if the username is valid or not. Valide usernames are: Char + Char/Num/special char (max len: 20, min len:6)
    const usernameRegex = /^[A-Za-z][A-Za-z0-9._-]{3,19}$/;

    let usrname = event.target.value;
    if(usernameRegex.test(usrname)){
        console.log("Valido")
        return;
    }
    console.log("Non valido")
    
});

function setRuleDiv() {
  const form = document.querySelector("#signin-div form");
  const icon = document.querySelector("#signin-username-div .fa-info");
  const rule = document.querySelector("#user-name-rule-div");

  const formRect = form.getBoundingClientRect();
  const iconRect = icon.getBoundingClientRect();

  rule.style.left = `${iconRect.right - formRect.left + 8}px`;
  rule.style.top = `${iconRect.top - formRect.top - 60}px`;
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
