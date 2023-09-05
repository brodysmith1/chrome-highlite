const qs = (query, parent = document) => parent.querySelector(query)
const qsa = (query, parent = document) => parent.querySelectorAll(query)
const url = () => window.location.origin + window.location.pathname

export function globalHandleClick(event) {
  let target = event.target
  let action = target.dataset?.highlightsExtAction

  // Check if target parents have el.dataset.highlightsExtAction
  if (!action) {
    while (target !== document.body && !action) {
      target = target.parentNode
      action = target.dataset.highlightsExtAction
    }
  }

  if (action) {
    event.stopPropagation()
    document.body.dataset.highlightsHasClicked = "yes"
    setTimeout(() => (document.body.dataset.highlightsHasClicked = ""), 40)
  }

  if (action === "copy") copyToClipboard(target)
  else if (action === "export-toggle") toggleExportMenu(event)
  else if (action === "export") exportCollection(target)
  else if (action === "tweet") tweetSelection(target)
  else if (action === "delete") deleteFromCollection(event)
  else if (action === "inspect") toggleEditingDialog(event)
  else if (action === "copy-all") copyAllHighlights(target)
  else {
    // If no action, close dialog
    const dialog = qs("#highlights-ext-dialog")
    dialog.dataset.highlightsExtActiveId = ""
    dialog.classList.remove("visible", "editing")
    applyClassesToHighlightId(event, "editing", "remove", true)
  }
}

async function tweetSelection(target) {
  const dialog = qs("#highlights-ext-dialog")
  const targetIsDialog = dialog?.contains(target)

  let id = ""
  let string = ""

  if (targetIsDialog) id = dialog.dataset.highlightsExtActiveId
  else id = getIdFromPanelListElement(target)

  if (id) string = (await getHighlight(id)).text
  else string = window.getSelection()?.toString() || ""

  const encodedString = encodeURIComponent(string);
  const href = `https://twitter.com/intent/tweet?text=${encodedString}&url=${url()}`
  window.open(href, "_blank")
}

async function copyAllHighlights(target) {
  const _url = url()
  const data = await chrome.storage.local.get(_url)
  const body = data[_url].collection.map((o) => o.text).join("\n\n")
  const title = `${document.title}`
  const text = [title, body, `Accessed: ${_url}`].join("\n\n")
  navigator?.clipboard?.writeText(text)

  target.classList.add("pressed")
  target.innerHTML = target.innerHTML.replace("Copy", "Copied")
  setTimeout(() => {
    target.classList.remove("pressed")
    target.innerHTML = target.innerHTML.replace("Copied", "Copy")
  }, 500)
}

async function copyToClipboard(target) {
  const dialog = qs("#highlights-ext-dialog")
  const targetIsDialog = dialog?.contains(target)

  let id = ""
  let text = ""

  if (targetIsDialog) id = dialog.dataset.highlightsExtActiveId
  else id = getIdFromPanelListElement(target)

  if (id) text = (await getHighlight(id)).text
  else text = window.getSelection()?.toString() || ""

  navigator?.clipboard?.writeText(text)

  if (targetIsDialog) {
    const copyButton = qs("#highlights-ext-btn-copy")
    copyButton.classList.add("pressed")
    copyButton.innerHTML = copyButton.innerHTML.replace("Copy", "Copied")
    setTimeout(() => {
      dialog.classList.remove("visible")
      setTimeout(() => {
        copyButton.classList.remove("pressed")
        copyButton.innerHTML = copyButton.innerHTML.replace("Copied", "Copy")
      }, 500)
    }, 450)
  } else {
    const label = qs(".label", target)
    target.classList.add("pressed")
    label.innerHTML = label.innerHTML.replace("Copy", "Copied")
    setTimeout(() => {
      target.classList.remove("pressed")
      label.innerHTML = label.innerHTML.replace("Copied", "Copy")
    }, 500)
  }
}

// if target has data-highlight-id attribute, toggle hover class
export function applyClassesToHighlightId(
  event,
  className = "hover",
  actionName,
  applyToGlobalHighlights
) {
  const id = event.target.dataset?.highlightsExtId
  if (id || applyToGlobalHighlights) {
    const action = actionName ?? (event.type === "mouseenter" ? "add" : "remove")
    qsa(`[data-highlights-ext-id${applyToGlobalHighlights ? "" : `="${id}"`}]`).forEach((item) => {
      item.classList[action](className)
    })
  }
}

// if target has data-highlight-id attribute, toggle editing dialog
export function toggleEditingDialog(event) {
  const target = event.target
  const id = target.dataset?.highlightsExtId
  const dialog = qs("#highlights-ext-dialog")

  if (id) {
    if (dialog.classList.contains("visible")) {
      dialog.dataset.highlightsExtActiveId = ""
      dialog.classList.remove("visible", "editing")
      applyClassesToHighlightId(event, "editing", "remove")
    } else {
      applyClassesToHighlightId(event, "editing", "add")
      showDialog(event, target)
      dialog.dataset.highlightsExtActiveId = id
    }
  }
}

export async function showDialog(event, focusElement) {
  const selection = window.getSelection()
  const dialog = qs("#highlights-ext-dialog")

  if (!dialog) return

  if (!selection.isCollapsed || focusElement) {
    const range = selection.getRangeAt(0)
    const rect = (focusElement || range).getBoundingClientRect()

    if (focusElement) dialog.classList.add("editing")
    if (!selection.isCollapsed) nudgeSelectionBoundaries(selection, range)

    // set dialog position
    dialog.style.top = `${rect.top}px`
    dialog.style.left = `${event.clientX}px`
    dialog.classList.add("visible")
  } else if (!event.target.dataset?.highlightsExtId) {
    dialog.classList.remove("visible")
  }
}

export async function toggleExportMenu() {
  const menu = qs("#highlights-ext-header-export-menu")
  menu.classList.toggle("open")
}

export async function exportCollection(target) {
  const _url = url()
  const data = await chrome.storage.local.get(_url)
  const type = target.dataset.highlightsExtExportType

  let extension = "txt"
  let heading = document.title
  let body = data[_url].collection.map((o) => o.text).join("\n\n").replace(/\n\n+/gi, "\n\n")

  if (type === "plain-text") {
    heading = `${heading}\n${_url}\n\n`
  }
  else if (type === "markdown") {
    extension = "md"
    heading = `# ${heading}\n\n[Link to original article](${_url})\n\n`
  }

  const blob = new Blob([heading, body], { type: "text/plain;charset=utf-8" })
  const link = URL.createObjectURL(blob)
  const filename = `${document.title.slice(0, 35).replace(":", " -")}.${extension}`

  chrome.runtime.sendMessage({ type: "exportCollection", link, filename })
}

export function addSelectionToCollection(event, htmlTemplate) {
  event.stopPropagation()

  const id = `${new Date().getTime()}-${Math.floor(Math.random() * 10000)}`
  const selection = window.getSelection()
  const text = selection?.toString()
  const item = { id, text }

  // TODO: add selection details to collection item
  chrome.runtime.sendMessage({ type: "addToCollection", item })

  // Create new html element
  const listElement = qs("#highlights-ext-list")
  const scrollElement = qs("#highlights-ext-list-wrapper")
  const html = htmlTemplate.replaceAll("{{id}}", id).replace("{{text}}", text)

  listElement.insertAdjacentHTML("beforeend", html)
  toggleListPlaceholderText()

  scrollElement.scrollTo({ top: listElement.scrollHeight, left: 0, behavior: "smooth" })

  styleSelection(id)
}

export function deleteFromCollection(event) {
  const dialog = qs("#highlights-ext-dialog")
  const targetIsDialog = dialog?.contains(event.target)

  let id
  if (targetIsDialog) id = dialog.dataset.highlightsExtActiveId
  else id = getIdFromPanelListElement(event.target)

  if (!id) return

  const panelItem = qs(`#highlights-ext-list-item-${id}`)
  const spanItems = qsa(`[data-highlights-ext-id="${id}"]`)

  panelItem.remove()
  spanItems.forEach((item) => {
    // remove span tags and replace with text content
    const text = item.textContent
    const parent = item.parentNode
    parent.replaceChild(document.createTextNode(text), item)
  })
  toggleListPlaceholderText()

  chrome.runtime.sendMessage({ type: "removeFromCollection", id })
  dialog.classList.remove("visible")
}

// Find the first word boundary in the backward direction
function nudgeSelectionBoundaries(selection, range = selection.getRangeAt(0)) {
  const hasWordBoundary = (range) => /[\s]/.test(range.toString())
  const { startContainer, endContainer } = range

  let rangeStart = document.createRange()
  let rangeEnd = document.createRange()

  rangeStart.setStart(startContainer, range.startOffset)
  rangeEnd.setStart(endContainer, range.endOffset)
  rangeStart.collapse(true)
  rangeEnd.collapse(true)

  // Step fwd/bwd until whitespace or the start/end of the node is found
  while (rangeStart.startOffset > 0 && !hasWordBoundary(rangeStart))
    rangeStart.setStart(startContainer, rangeStart.startOffset - 1)

  while (rangeEnd.endOffset < endContainer.length && !hasWordBoundary(rangeEnd))
    rangeEnd.setEnd(endContainer, rangeEnd.endOffset + 1)

  if (rangeStart.startOffset > 0)
    rangeStart.setStart(range.startContainer, rangeStart.startOffset + 1)

  if (rangeEnd.endOffset < endContainer.length)
    rangeEnd.setEnd(endContainer, rangeEnd.endOffset - 1)

  // Update selection position
  selection.setBaseAndExtent(
    startContainer,
    rangeStart.startOffset,
    endContainer,
    rangeEnd.endOffset
  )
}

function traverseSelectionNodes() {
  var selection = window.getSelection()
  var range = selection.getRangeAt(0)
  var container = range.commonAncestorContainer
  var nodes = []

  // Recursive function to traverse nodes
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Add text node to the list
      nodes.push(node)
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Recursively traverse child nodes
      for (var i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i])
      }
    }
  }

  // Start traversing from the common ancestor container
  traverse(container)

  return nodes.filter(
    (node) => selection.containsNode(node, true) && node.textContent.trim().length
  )
}

// apply a class to each text node in the user's selection
function styleSelection(id) {
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)

  const getClassedSpanElement = () => {
    const node = document.createElement("span")
    node.classList.add("highlights-ext-in-text-highlight")
    node.setAttribute("data-highlights-ext-id", id)
    node.setAttribute("data-highlights-ext-action", "inspect")
    return node
  }

  if (range.startContainer === range.endContainer) {
    range.surroundContents(getClassedSpanElement())
  } else {
    const selectedNodes = traverseSelectionNodes()
    selectedNodes.forEach((node) => {
      const _range = document.createRange()
      const span = getClassedSpanElement()

      if (node === range.startContainer) {
        // wrap the span from range.startOffset to the end of the child node
        _range.setStart(node, range.startOffset)
        _range.setEnd(node, node.length)
        _range.surroundContents(span)
      } else if (node === range.endContainer) {
        if (range.endOffset === 0) return
        // wrap the span from the beginning of the child node to range.endOffset
        _range.setStart(node, 0)
        _range.setEnd(node, range.endOffset)
        _range.surroundContents(span)
      } else {
        // wrap the entire child node
        _range.selectNode(node)
        _range.surroundContents(span)
      }
    })
  }

  selection.collapseToStart()
}

const getHighlight = async (id) => {
  const _url = url()
  const data = await chrome.storage.local.get(_url)
  return data[_url].collection.find((item) => item.id === id)
}

const getIdFromPanelListElement = (target) => {
  let id = ""
  while (target !== document.body && !id) {
    id = target.dataset.highlightsExtItemId
    target = target.parentNode
  }
  return id
}

const toggleListPlaceholderText = () => {
  const list = qs("#highlights-ext-list")
  const placeholder = qs("#highlights-ext-list-placeholder")
  placeholder.classList.toggle("highlights-ext-hidden", list.children.length > 1)
}
