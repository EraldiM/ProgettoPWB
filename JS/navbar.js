// With this methos we can call sleep as a function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const d = document;

window.addEventListener("load", async ()=>{
    try {
        const res = await fetch("/api/me");

        const data = await res.json();
        if (data.authenticated){
            d.getElementById("sub-menu-login").hidden = true;
            d.getElementById("sub-menu-signin").hidden = true;
            d.getElementById("sub-menu-profile").hidden = false;
            d.getElementById("sub-menu-prenotation").hidden = false;
            d.getElementById("sub-menu-exit").hidden = false;
        }
        
    } catch (error) {
        console.log("Error:", error);
    }
});

// Makes the sub-menu of the profile icon appear if we hover the profile icon.
document.getElementById("profile").addEventListener("mouseenter", ()=>{
    document.getElementById("icon-sub-menu").classList.remove("hidden");
});

// this function makes the submenu that pops us after we enter the icon with the mouse disappear after 2 sec we left it.
// If we come back in 2 secons, the menu keeps showing.
document.getElementById("icon-sub-menu").addEventListener("mouseleave", async (event)=>{
    await sleep(1500); 
    if (!event.target.matches(':hover')){
        document.getElementById("icon-sub-menu").classList.add("hidden");
    }
});

document.getElementById("submenu-exit-button").addEventListener("click", async ()=>{
    try {
        const res = await fetch("/api/logout", {
                method: "POST"
            });

        const data = await res.json();
        console.log(data);
        if (data.success){
            window.location.reload();
            return;
        }
    } catch (error) {
        console.log("Error:", error);
    }      
});

document.querySelectorAll(".navbar > ul > li > a[href]").forEach((link) => {
  const paginaDelLink = new URL(link.href).pathname;

  if (paginaDelLink === window.location.pathname) {
    link.setAttribute("aria-current", "page");
  }
});
