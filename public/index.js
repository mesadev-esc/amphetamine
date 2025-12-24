"use strict";

// Existing elements
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

// Tab elements
const tabsContainer = document.getElementById("tabs-container");
const addTabButton = document.getElementById("add-tab");
const tabContent = document.getElementById("tab-content");
const backButton = document.getElementById("back-button");
const forwardButton = document.getElementById("forward-button");
const reloadButton = document.getElementById("reload-button");

// Tab management
let tabs = [];
let activeTabId = null;

// Enhanced check for required APIs and secure context
function areRequiredAPIsAvailable() {
	// Check if we're in a secure context or localhost
	const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
	const isSecureContext = window.isSecureContext;
	
	if (!isLocalhost && !isSecureContext) {
		console.warn("Not in a secure context. Some APIs may be restricted.");
	}
	
	// Check for required objects and functions
	return (
		typeof $scramjetLoadController !== 'undefined' &&
		typeof BareMux !== 'undefined' &&
		'serviceWorker' in navigator
	);
}

// Tab functions
function createTab() {
	const tabId = Date.now().toString();
	const tabElement = document.createElement("div");
	tabElement.className = "tab";
	tabElement.dataset.tabId = tabId;
	
	const tabTitle = document.createElement("span");
	tabTitle.className = "tab-title";
	tabTitle.textContent = "New Tab";
	
	const closeBtn = document.createElement("span");
	closeBtn.className = "tab-close";
	closeBtn.innerHTML = "&times;";
	closeBtn.onclick = (e) => {
		e.stopPropagation();
		closeTab(tabId);
	};
	
	tabElement.appendChild(tabTitle);
	tabElement.appendChild(closeBtn);
	
	tabElement.addEventListener("click", () => switchTab(tabId));
	tabsContainer.appendChild(tabElement);
	
	const frameContainer = document.createElement("div");
	frameContainer.className = "tab-frame";
	frameContainer.id = `frame-${tabId}`;
	tabContent.appendChild(frameContainer);
	
	tabs.push({
		id: tabId,
		element: tabElement,
		frameContainer: frameContainer,
		frame: null,
		url: null
	});
	
	switchTab(tabId);
	return tabId;
}

function closeTab(tabId) {
	if (tabs.length <= 1) return; // Don't close the last tab
	
	const tabIndex = tabs.findIndex(t => t.id === tabId);
	if (tabIndex === -1) return;
	
	const tab = tabs[tabIndex];
	
	// Remove elements
	tab.element.remove();
	tab.frameContainer.remove();
	
	// Remove from array
	tabs.splice(tabIndex, 1);
	
	// Switch to adjacent tab if closed tab was active
	if (activeTabId === tabId) {
		const newActiveIndex = Math.min(tabIndex, tabs.length - 1);
		if (newActiveIndex >= 0) {
			switchTab(tabs[newActiveIndex].id);
		}
	}
}

function switchTab(tabId) {
	const tab = tabs.find(t => t.id === tabId);
	if (!tab) return;
	
	// Update active states
	tabs.forEach(t => {
		t.element.classList.toggle("active", t.id === tabId);
		t.frameContainer.classList.toggle("active", t.id === tabId);
	});
	
	activeTabId = tabId;
	
	// Update address bar with current tab's URL
	if (tab.url) {
		address.value = tab.url;
	} else {
		address.value = "";
	}
}

function getCurrentTab() {
	return tabs.find(t => t.id === activeTabId);
}

function updateTabTitle(tabId, title) {
	const tab = tabs.find(t => t.id === tabId);
	if (tab) {
		const titleElement = tab.element.querySelector(".tab-title");
		titleElement.textContent = title.length > 15 ? title.substring(0, 15) + "..." : title;
	}
}

// Navigation functions
function goBack() {
	const tab = getCurrentTab();
	if (tab && tab.frame && tab.frame.frame.contentWindow) {
		tab.frame.frame.contentWindow.history.back();
	}
}

function goForward() {
	const tab = getCurrentTab();
	if (tab && tab.frame && tab.frame.frame.contentWindow) {
		tab.frame.frame.contentWindow.history.forward();
	}
}

function reload() {
	const tab = getCurrentTab();
	if (tab && tab.frame) {
		if (tab.url) {
			tab.frame.go(tab.url);
		}
	}
}

// Initialize only if we have the required APIs
if (areRequiredAPIsAvailable()) {
	try {
		const { ScramjetController } = $scramjetLoadController();

		const scramjet = new ScramjetController({
			files: {
				wasm: '/scram/scramjet.wasm.wasm',
				all: '/scram/scramjet.all.js',
				sync: '/scram/scramjet.sync.js',
			},
		});

		scramjet.init();

		// Initialize BareMux
		const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

		// Tab event listeners
		addTabButton.addEventListener("click", createTab);
		backButton.addEventListener("click", goBack);
		forwardButton.addEventListener("click", goForward);
		reloadButton.addEventListener("click", reload);

		form.addEventListener("submit", async (event) => {
			event.preventDefault();

			try {
				await registerSW();
			} catch (err) {
				error.textContent = "Failed to register service worker.";
				errorCode.textContent = err.toString();
				throw err;
			}

			const url = search(address.value, searchEngine.value);
			const tab = getCurrentTab();
			
			if (tab) {
				// Use external wisp-server-python
				let wispUrl = "ws://localhost:6001/";

				if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
					await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
				}

				// Create or reuse frame
				if (!tab.frame) {
					tab.frame = scramjet.createFrame();
					tab.frame.frame.id = `sj-frame-${tab.id}`;
					tab.frame.frame.style.width = "100%";
					tab.frame.frame.style.height = "100%";
					tab.frame.frame.style.border = "none";
					tab.frameContainer.appendChild(tab.frame.frame);
				}
				
				tab.frame.go(url);
				tab.url = url;
				
				// Add class to body to hide disclaimer/footer when content is shown
				document.body.classList.add("has-content");
				
				// Update tab title when page loads
				tab.frame.frame.onload = () => {
					try {
						const title = tab.frame.frame.contentDocument.title || new URL(url).hostname;
						updateTabTitle(tab.id, title);
					} catch (e) {
						updateTabTitle(tab.id, "New Tab");
					}
				};
			}
		});
		
		// Create the first tab
		createTab();
		
		console.log("Proxy functionality initialized successfully.");
	} catch (err) {
		console.error("Error initializing proxy functionality:", err);
		error.textContent = "Error initializing proxy functionality.";
		errorCode.textContent = err.toString();
	}
} else {
	// Handle case where required APIs are not available
	console.warn("Required APIs not available. Proxy functionality disabled.");
	error.textContent = "Proxy functionality is not available.";
	errorCode.textContent = "This application requires a secure context (HTTPS) or localhost. " +
		"If you're not accessing this via localhost, please use HTTPS.";
	
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		// Show a more descriptive error
		error.textContent = "Proxy functionality is not available.";
		errorCode.textContent = "This application requires a secure context (HTTPS) or localhost.\n" +
			"Current location: " + window.location.origin + "\n" +
			"Secure context: " + (window.isSecureContext ? "Yes" : "No");
	});
}

// Removed unused functions