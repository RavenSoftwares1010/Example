const submitButton = document.getElementById("Submit");

submitButton.addEventListener("click", async () => {
  const username = document.getElementById("nameInput").value;
  const passcode = document.getElementById("passInput").value;

  if (!username || !passcode) return alert("Please fill out all fields.");

  const response = await fetch("/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ username, passcode })
  });

  const result = await response.json();

  if (result.status === "success") {
    localStorage.setItem("username", username); // save username for map page
    window.location.href = result.redirect;
  } else {
    alert(result.message);
  }
});

