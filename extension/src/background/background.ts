chrome.runtime.onMessage.addListener(
  function (request, sender, onSuccess) {
    if (request.action === "AUTH_CHECK") {
      console.log("running check")
      fetch("http://localhost:3000/api/auth/session", {
          mode: 'cors',
      })
        .then(response => response.json())
        .then((session) => {
            if (Object.keys(session).length > 0) {
              console.log(session)
              onSuccess(session)
            } else {
              onSuccess(null)
            }
        })
        .catch(err => {
          console.error(err);
          onSuccess(null)
        })

      return true;  // Will respond asynchronously.
    } else return true
  }
)