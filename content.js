; (async () => {
  // Load html snippets. All paths need to be defined in manifest.json
  const fetchHtml = async (url) =>
    fetch(chrome.runtime.getURL(url)).then((response) => response.text())

  const html = {
    panel: await fetchHtml("html/panel.html"),
    sprite: await fetchHtml("html/sprite.html"),
    dialog: await fetchHtml("html/dialog.html"),
    listItem: await fetchHtml("html/list-item.html"),
  }

  // Add elements to page
  document.body.insertAdjacentHTML("beforeend", html.panel)
  document.body.insertAdjacentHTML("beforeend", html.sprite)
  document.body.insertAdjacentHTML("beforeend", html.dialog)

  // Load javascript libraries
  const library = chrome.runtime.getURL("functions.js")
  const { addSelectionToCollection, showDialog, applyClassesToHighlightId, globalHandleClick } =
    await import(library)

  // Get html element handles
  const panelWrapper = document.querySelector("#highlights-ext-wrapper")
  const toggleButton = document.querySelector("#highlights-ext-toggle-btn")

  // on toggle click: Show/hide panel
  toggleButton.addEventListener("click", () => panelWrapper.classList.toggle("open"))

  // onmouseup: Show dialog
  document.addEventListener("mouseup", (e) => {
    e.stopPropagation()
    if (e.detail === 1) {
      setTimeout(() => {
        if (!document.body.dataset.highlightsHasClicked) showDialog(e)
      }, 20)
    }
  })

  // add/remove hover class to related highlight elements
  document.addEventListener("mouseenter", applyClassesToHighlightId, true)
  document.addEventListener("mouseleave", applyClassesToHighlightId, true)

  // on click: Handle global click events
  document.addEventListener("click", globalHandleClick, true)
  document.addEventListener("dblclick", showDialog, true)

  // Disable site's pointer events to prevent selection conflicts (i.e. brookings.edu)
  document.addEventListener("pointerup", (e) => e.stopPropagation(), true)
  document.addEventListener("pointerdown", (e) => e.stopPropagation(), true)

  // Create event listeners for dialog buttons
  const dialogActions = [
    {
      id: "highlights-ext-btn-add",
      eventType: "click",
      callback: (e) => addSelectionToCollection(e, html.listItem),
    },
  ]

  dialogActions.forEach(({ id, eventType, callback }) => {
    document.querySelector(`#${id}`)?.addEventListener(eventType, callback)
  })
})()
