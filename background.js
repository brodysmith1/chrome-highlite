const toggleExtensionEnabled = (enable) => {
  const qs = (query, parent = document) => parent.querySelector(query)
  const qsa = (query, parent = document) => parent.querySelectorAll(query)
  const toggleClass = (el) => el.classList.toggle("highlights-ext-disabled", !enable)

  toggleClass(qs("#highlights-ext-wrapper"))
  toggleClass(qs("#highlights-ext-dialog"))
  toggleClass(qs("#highlights-ext-icon-spritesheet"))
  qsa(".highlights-ext-in-text-highlight").forEach(toggleClass)
}

chrome.runtime.onInstalled.addListener(async () => {
  // When browser opened. Runs once globally for all tabs.
  // chrome.storage.local.clear()
})

// Only enable the extension when the user has clicked the icon for the current tab
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url.match(/^https*/)) return

  // id is url with hash and queries removed
  const { url, id: tabId } = tab
  const pageId = url.split(/[#\?]/g)[0]

  const contentInjected = (
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.querySelector("#highlights-ext-wrapper"),
    })
  )[0].result

  const data = await chrome.storage.local.get(null)
  const pageData = data[pageId]
  const enabled = contentInjected ? !pageData.enabled : true
  const collection = contentInjected ? pageData.collection : []
  const count = String(collection.length)

  await chrome.storage.local.set({ [pageId]: { enabled, collection } })

  if (!contentInjected) {
    // if [content.js] hasn't been executed, inject it
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    })
  } else {
    // if it hasn't, toggle the element's visibility
    await chrome.scripting.executeScript({
      target: { tabId },
      func: toggleExtensionEnabled,
      args: [enabled],
    })
  }

  if (enabled) {
    chrome.action.setBadgeText({ tabId, text: count })
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#ecc010" })
  } else {
    chrome.action.setBadgeText({ tabId, text: "0" })
    chrome.action.setBadgeBackgroundColor({ tabId, color: "#888" })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { url, tab } = sender
  const tabId = tab.id
  const pageId = url.split(/[#\?]/g)[0]

  if (message.type === "addToCollection") {
    chrome.storage.local.get(pageId, (response) => {
      const data = response[pageId]
      data.collection.push(message.item)
      chrome.storage.local.set({ [pageId]: data })
      chrome.action.setBadgeText({ tabId, text: data.collection.length.toString() })
    })
  } else if (message.type === "removeFromCollection") {
    chrome.storage.local.get(pageId, (response) => {
      const data = response[pageId]
      const index = data.collection.findIndex((item) => item.id === message.id)
      data.collection.splice(index, 1)
      chrome.storage.local.set({ [pageId]: data })
      chrome.action.setBadgeText({ tabId, text: data.collection.length.toString() })
    })
  } else if (message.type === "exportCollection") {
    const { link, filename } = message
    chrome.downloads.download({ url: link, filename })
  }
})
