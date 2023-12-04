window.addEventListener('load', () => {
    // Get elements and localized strings
    const titleText = document.getElementById('titleText');
    const apiText = document.getElementById('apiText');
    const chooseModelText = document.getElementById('choose-model-text');
    const submitButton = document.getElementById('submit');
    const resetButton = document.getElementById('reset');
    const apiKeyInput = document.getElementById('content');
    const apiModelSelect = document.getElementById('apiModel');
    const apiTypeSelect = document.getElementById('apiType');
    const status = document.getElementById('status');

    titleText.innerText = chrome.i18n.getMessage('optionsTitle');
    apiText.innerText = chrome.i18n.getMessage('apiTitle');
    chooseModelText.innerText = chrome.i18n.getMessage('apiModelTitle');

    // Disable the submit button by default
    submitButton.disabled = apiKeyInput.value.length < 10;

    // Update status message function
    function updateStatus(message, color) {
        status.innerText = message;
        status.style.color = color;
    }

    // Function to save settings to Chrome storage
    function saveApiSettings() {
        const apiType = apiTypeSelect.value;
        const apiKey = apiKeyInput.value;
        const apiModel = apiModelSelect.value;

        chrome.storage.local.set({ apiType, apiKey, apiModel }, () => {
            updateStatus('Settings saved. The extension is ready to use.', 'lightgreen');
        });
    }

    // Load saved settings from Chrome storage
    chrome.storage.local.get(['apiType', 'apiKey', 'apiModel'], (result) => {
        if (result.apiType) {
            apiTypeSelect.value = result.apiType;
        }
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
        if (result.apiModel) {
            apiModelSelect.value = result.apiModel;
        }
    });

    // Event listeners
    apiKeyInput.addEventListener('input', () => {
        submitButton.disabled = apiKeyInput.value.length < 10;
    });

    submitButton.addEventListener('click', (event) => {
        event.preventDefault();
        saveApiSettings();
    });

    resetButton.addEventListener('click', (event) => {
        event.preventDefault();
        chrome.storage.local.set({ apiType: '', apiKey: '', apiModel: '' });
        apiTypeSelect.value = '';
        apiKeyInput.value = '';
        apiModelSelect.value = '';
        updateStatus('Settings reset. Please enter new settings.', 'red');
    });

    // Load default model if not set
    const defaultModel = 'gpt-3.5-turbo';
    if (!apiModelSelect.value) {
        apiModelSelect.value = defaultModel;
        chrome.storage.local.set({ apiModel: defaultModel });
    }

    apiModelSelect.addEventListener('change', () => {
        chrome.storage.local.set({ apiModel: apiModelSelect.value });
    });
});
