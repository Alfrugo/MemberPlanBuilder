(() => {
  console.log("Hello Worldddd!");
  const t = document.getElementById("zipInput");
  document
    .getElementById("searchButton")
    .addEventListener("click", async () => {
      const n = t.value.trim(),
        e = await (async function () {
          try {
            const t = await fetch("./html-plans/output-format.json");
            if (!t.ok)
              throw new Error(
                `Failed to read data: ${t.status} ${t.statusText}`
              );
            return (await t.json()).plans;
          } catch (t) {
            return console.error("Error reading plans:", t), [];
          }
        })();
      !(function (t, n) {
        const e = document.querySelector(".bookList"),
          o = document.getElementById("descriptionContainer");
        (e.innerHTML = ""),
          (o.innerHTML = ""),
          t.filter((t) => t.ZipCode.includes(n))
            .forEach((t) => {
              const n = document.createElement("li");
              (n.textContent = t.Title),
                n.addEventListener("click", async () => {
                  if (
                    (console.log(t.Description),
                    t.Description.endsWith(".html"))
                  )
                    try {
                      const n = await fetch(`html-plans/${t.Description}`);
                      if (!n.ok)
                        throw new Error(
                          `Failed to read data: ${n.status} ${n.statusText}`
                        );
                      const e = await n.text();
                      o.innerHTML = e;
                    } catch (t) {
                      console.error("Error reading HTML content:", t),
                        (o.innerHTML =
                          "<strong>Description:</strong> Unable to load content.");
                    }
                  else {
                    if ("" === t.Url)
                      return void (o.innerHTML = `<strong>Description:</strong> ${t.Description}`);
                    window.open(t.Url, "_blank");
                  }
                }),
                e.appendChild(n);
            });
      })(e, n),
        console.log("all plans"),
        console.log(e);
    });
})();
