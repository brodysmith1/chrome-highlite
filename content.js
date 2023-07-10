;(async () => {
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
  const {
    exportCollection,
    addSelectionToCollection,
    showDialog,
    applyClassesToHighlightId,
    toggleEditingDialog,
    deleteFromCollection,
  } = await import(library)

  const onLoad = () => {
    // Detect if body background color is darkish or lightish
    const bodyBackgroundColor = window.getComputedStyle(document.body).backgroundColor
    const bodyBackgroundRGB = bodyBackgroundColor.match(/\d+/g)
    const bodyBackgroundAlpha = bodyBackgroundRGB[3] || 1
    const bodyBackgroundLuminance =
      (0.299 * bodyBackgroundRGB[0] + 0.587 * bodyBackgroundRGB[1] + 0.114 * bodyBackgroundRGB[2]) /
      255

    const isDark = 1 - bodyBackgroundAlpha * bodyBackgroundLuminance < 0.5

    console.log(
      "Is dark:",
      isDark,
      bodyBackgroundColor,
      bodyBackgroundLuminance,
      bodyBackgroundAlpha
    )
  }

  onLoad()

  // Get html element handles
  const panelWrapper = document.querySelector("#highlights-ext-wrapper")
  const toggleButton = document.querySelector("#highlights-ext-toggle-btn")

  // on toggle click: Show/hide panel
  toggleButton.addEventListener("click", () => panelWrapper.classList.toggle("open"))

  // ondblclick: Show dialog
  document.addEventListener("dblclick", showDialog)

  // onmouseup: Show dialog
  document.addEventListener("mouseup", (e) => {
    if (e.detail === 1) {
      setTimeout(() => showDialog(e), 50)
    }
  })

  // add/remove hover class to related highlight elements
  document.addEventListener("mouseenter", applyClassesToHighlightId, true)
  document.addEventListener("mouseleave", applyClassesToHighlightId, true)

  // on click: Toggle editing dialog
  document.addEventListener("click", toggleEditingDialog)

  // Create event listeners for dialog buttons
  const dialogActions = [
    {
      id: "highlights-ext-btn-add",
      eventType: "click",
      callback: (e) => addSelectionToCollection(e, html.listItem),
    },
    {
      id: "highlights-ext-btn-delete",
      eventType: "click",
      callback: (e) => deleteFromCollection(e),
    },
    {
      id: "highlights-ext-btn-export",
      eventType: "click",
      callback: () => exportCollection(),
    },
  ]

  dialogActions.forEach(({ id, eventType, callback }) => {
    document.querySelector(`#${id}`)?.addEventListener(eventType, callback)
  })
})()
