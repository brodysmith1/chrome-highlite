const qs = (query, parent = document) => parent.querySelector(query)
const qsa = (query, parent = document) => parent.querySelectorAll(query)

// if target has data-highlight-id attribute, toggle hover class
export function applyClassesToHighlightId(
  event,
  className = "hover",
  actionName,
  applyToAllHighlights
) {
  const id = event.target.dataset?.highlightsExtId
  if (id || applyToAllHighlights) {
    const action = actionName ?? (event.type === "mouseenter" ? "add" : "remove")
    qsa(`[data-highlights-ext-id${applyToAllHighlights ? "" : `="${id}"`}]`).forEach((item) => {
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
    event.stopPropagation()
    if (dialog.classList.contains("visible")) {
      dialog.classList.remove("visible", "editing")
      applyClassesToHighlightId(event, "editing", "remove")
    } else {
      applyClassesToHighlightId(event, "editing", "add")
      showDialog(event, target)
    }
  } else {
    dialog.classList.remove("visible", "editing")
    applyClassesToHighlightId(event, "editing", "remove", true)
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
    dialog.style.left = `${event.pageX}px`
    dialog.classList.add("visible")
  } else if (!event.target.dataset?.highlightsExtId) {
    dialog.classList.remove("visible")
  }
}

export function exportCollection() {
  chrome.storage.local.get("collection", (data) => {
    const title = document.title
    const frontmatter = `# ${title}\n\n[Link to original article](${window.location.href})\n\n`
    const markdown = data.collection.join("\n\n").replace(/\n\n+/gi, "\n\n")
    const blob = new Blob([frontmatter, markdown], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    chrome.runtime.sendMessage({ type: "exportCollection", url, title: title.slice(0, 25) })
  })
}

export function addSelectionToCollection(event, htmlTemplate) {
  event.stopPropagation()

  const id = `${new Date().getTime()}-${Math.floor(Math.random() * 10000)}`
  const text = window.getSelection()?.toString()
  const item = { id, text }

  chrome.runtime.sendMessage({ type: "addToCollection", item })

  // Create new html element
  const listElement = qs("#highlights-ext-list")
  const scrollElement = qs("#highlights-ext-list-wrapper")

  const html = htmlTemplate.replace("{{id}}", id).replace("{{text}}", text)

  listElement.insertAdjacentHTML("beforeend", html)
  scrollElement.scrollTo({ top: listElement.scrollHeight, left: 0, behavior: "smooth" })

  // Style the selected text
  styleSelection(id)
}

export function deleteFromCollection(event, id) {
  event.stopPropagation()

  id = id ?? qs(".highlights-ext-in-text-highlight.editing")?.dataset?.highlightsExtId

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

  chrome.runtime.sendMessage({ type: "removeFromCollection", id })
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
