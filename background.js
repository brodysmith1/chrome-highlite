const HTTPS_PREFIX = "https://"

chrome.runtime.onInstalled.addListener(async () => {
  chrome.storage.local.set({ collection: [] })
  chrome.action.setBadgeText({
    text: "OFF",
  })
})

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(HTTPS_PREFIX)) {
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id })
    const enabled = prevState === "OFF"
    const text = enabled ? "ON" : "OFF"
    const cssFunction = enabled ? "insertCSS" : "removeCSS"

    chrome.action.setBadgeText({ text })

    await chrome.scripting[cssFunction]({
      files: ["styles.css"],
      target: { tabId: tab.id },
    })
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "addToCollection") {
    chrome.storage.local.get("collection", (data) => {
      data.collection.push(message.item)
      chrome.storage.local.set({ collection: data.collection })
    })
  } else if (message.type === "removeFromCollection") {
    chrome.storage.local.get("collection", (data) => {
      const index = data.collection.findIndex((item) => item.id === message.id)
      data.collection.splice(index, 1)
      chrome.storage.local.set({ collection: data.collection })
    })
  } else if (message.type === "exportCollection") {
    chrome.downloads.download({ url: message.url, filename: `${message.title}.md` })
  }
})
