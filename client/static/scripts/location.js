const username = localStorage.getItem("username");

navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    fetch("/update-location", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ username, lat, lng })
    });
});
