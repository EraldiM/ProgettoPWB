
export function createPopup(){
    let popupDiv = document.createElement("div");
    popupDiv.classList.add("pop-up");
    // We make sure that the browser first render the pop-up and then we give to then div the other class.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            popupDiv.classList.add("pop-up-transform"); 

            setTimeout(() => {
                popupDiv.addEventListener("transitionend", () => {
                    popupDiv.remove(); // Rimosso dopo la risalita
              }, { once: true });

              popupDiv.classList.remove("pop-up-transform"); // Risale
        }, 3000);
    });
});
    return popupDiv;
}

export function removePopup(popUp){
    popUp.remove();
}

export function setPopup(titleText, paragraphText, containerToAppend){
    if(document.querySelector(".pop-up")){return;}
    let popUp = createPopup();
    let title = document.createElement("h1");
    title.textContent = titleText;
    let paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    popUp.appendChild(title);
    popUp.appendChild(paragraph);
    containerToAppend.insertBefore(popUp, containerToAppend.firstChild);
}
