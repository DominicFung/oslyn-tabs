const host = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://tabs.oslyn.io"

chrome.runtime.onMessage.addListener(
  function (request, sender, onSuccess) {
    if (request.action === "AUTH_CHECK") {
      console.log(`Oslyn AUTH_CHECK on ${host}`)
      fetch(`${host}/api/auth/session`, {
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