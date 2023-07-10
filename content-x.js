// Apply the .highlights-highlight class to the selected text, knowing the selected text may span multiple nodes.
// function applyClassToRange(range, className) {}
// function getNodesInRange(startContainer, endContainer) {}
// const range = selection.getRangeAt(0)
// console.log(selection, range)
// const nodes = getNodesInRange(range.startContainer, range.endContainer)
// nodes.forEach((node) => {
//   const span = document.createElement("span")
//   span.classList.add("highlights-highlight")
//   node.parentNode.replaceChild(span, node)
//   span.appendChild(node)
// })

let lastSelection

let dialog = document.createElement("div")
let addButton = document.createElement("button")
let exportButton = document.createElement("button")
dialog.id = "highlights-dialog"
dialog.innerHTML = `
  <div class="dialog-buttons">
    <button id="highlights-add" class="highlights-btn">Highlight</button>
    <button id="highlights-share" class="highlights-btn">Share</button>
    <button id="highlights-export" class="highlights-btn">Export</button>
  </div>
`
document.body.appendChild(dialog)

function applyClassToRange(range, className) {
  var startContainer = range.startContainer
  var endContainer = range.endContainer
  var startOffset = range.startOffset
  var endOffset = range.endOffset

  // Get all nodes between start and end containers
  var nodes = getNodesInRange(startContainer, endContainer)

  // Split start container at start offset if it is a text node
  // if (startContainer.nodeType === Node.TEXT_NODE) {
  //   startContainer = startContainer.splitText(startOffset)
  //   startOffset = 0
  // }

  // // Split end container at end offset if it is a text node
  // if (endContainer.nodeType === Node.TEXT_NODE) {
  //   endContainer.splitText(endOffset)
  // }

  // Wrap each text node in a span element
  nodes
    .filter(function (node, i) {
      console.log(i, node)
      return node?.nodeType === Node.TEXT_NODE
    })
    .forEach(function (node, i) {
      if (node === startContainer) node.splitText(startOffset)
      if (node === endContainer) node.splitText(endOffset)

      var span = document.createElement("span")
      span.classList.add(className)
      node.parentNode.insertBefore(span, node)
      span.appendChild(node)
    })
}

// Helper function to get all nodes between start and end containers
function getNodesInRange(startContainer, endContainer) {
  let nodes = [startContainer]
  let node = startContainer.nextSibling

  while (node && node !== endContainer) {
    node = node.nextSibling
    nodes.push(node)
  }

  return nodes
}

function styleSelectedText() {
  const selection = window.getSelection()
  const range = selection.getRangeAt(0)

  // If start and end containers are the same, split the text node
  // at the end offset and then split the text node at the start offset
  if (range.startContainer !== range.endContainer) {
    applyClassToRange(range, "highlights-highlight")
  } else {
    const newNode = document.createElement("span")
    newNode.classList.add("highlights-highlight")
    range.surroundContents(newNode)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

function showDialog(event) {
  const selection = window.getSelection()

  if (!selection.isCollapsed) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    dialog.style.top = `${rect.top}px`
    dialog.style.left = `${event.pageX}px`
    dialog.classList.add("visible")
  } else {
    dialog.classList.remove("visible")
  }
}

document.addEventListener("dblclick", showDialog)
document.addEventListener("mouseup", (event) => {
  if (event.detail === 1) {
    setTimeout(() => showDialog(event), 50)
  }
})

// Highlight button
document.querySelector("#highlights-add").addEventListener("click", () => {
  const text = window.getSelection()?.toString()
  chrome.runtime.sendMessage({ type: "addTextToCollection", text })
  styleSelectedText()
})

// Export button
document.querySelector("#highlights-export").addEventListener("click", () => {
  chrome.storage.local.get("collection", (data) => {
    const title = document.title
    const frontmatter = `# ${title}\n\n[Link to original article](${window.location.href})\n\n`
    const markdown = data.collection.join("\n\n").replace(/\n\n+/gi, "\n\n")
    const blob = new Blob([frontmatter, markdown], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    chrome.runtime.sendMessage({ type: "exportCollection", url, title: title.slice(0, 25) })
  })
})
