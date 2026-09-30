
export function createPopup(){
    let popupDiv = document.createElement("div");
    popupDiv.classList.add("pop-up");
    popupDiv.classList.add("hidden2");
    return popupDiv;
}

export function removePopup(popUp){
    popUp.remove();
}

export function setPopup(titleText, paragraphText, containerToAppend){
    let popUp = createPopup();
    let title = document.createElement("h1");
    title.textContent = titleText;
    let paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    popUp.appendChild(title);
    popUp.appendChild(paragraph);
    containerToAppend.insertBefore(popUp, containerToAppend.firstChild);
    popUp.offsetHeight;
    popUp.classList.remove("hidden2");
    popUp.addEventListener("transitionend", (event)=>{
        if (event.propertyName=== "opacity"){
            popUp.classList.add("line");
        }
    }), {once: true};
    popUp.addEventListener("animationend", (event)=>{
        if(event.animationName == "expandLine"){
            popUp.classList.add("hidden2");
        }
        popUp.addEventListener("transitionend", (event)=>{
            if (event.propertyName=== "opacity"){
                popUp.remove();
            }
        }), {once: true};
    });

}
