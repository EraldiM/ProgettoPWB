window.addEventListener("load", async function(){
    const coach_id = window.location.search;
    if(coach_id){
    try {
        const res = await fetch(`/GET/coach-info${coach_id}`, {
            method: "GET",
            headers: {"Content-Type": "application/json"},
        });

        const data = await res.json();
        console.log(data[0]);
    } catch (error) {
       console.log("Errore:", error);
    }
    }
});
