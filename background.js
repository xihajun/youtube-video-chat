// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.tabs.create({ url: "options.html" });
    }
});

// get the current time for context in the system message
let time = new Date().toLocaleString('en-US');

// create a system message
const systemMessage = "The GPT is designed to behave like a specific YouTuber, using their style and tone in responses. Initially, it will provide short and precise answers, limited to 10 words.\nIf the conversation continues, it will expand the answers, explaining in a simple, easy-to-understand manner, as if speaking to a 10-year-old.\nThe GPT's primary focus is on the script provided by the user.\nIf asked about topics not covered in the script, the GPT will initially state its lack of knowledge or that it wasn't covered in the previous talk.\nHowever, if pressed further, it will use its pre-trained knowledge to provide relevant information.\nThe goal is to emulate the YouTuber's presentation style while engaging users with clear, concise, and age-appropriate explanations.\nHow to response:\n1st answer, short but within the given content\n2nd answer, easy to follow can be longer, but please find the answer within the given scripts\n3rd answer, can off topic based on your pretrained knowledge"

// initialize the message array with a system message
let messageArray = [
    { role: "system", content: systemMessage }
];

// a event listener to listen for a message from the content script that says the user has openend the popup
chrome.runtime.onMessage.addListener(function (request) {
    // check if the request contains a message that the user has opened the popup
    if (request.openedPopup) {
        // reset the message array to remove the previous conversation
        messageArray = [
            { role: "system", content: systemMessage }
        ];
    }
});

async function handleApiRequest(apiType, apiKey, apiModel, inputText) {
    let apiUrl, apiHeaders, apiBody;

    if (apiType === 'openai') {
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        apiHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };
        apiBody = JSON.stringify({
            "model": apiModel, // Replace with your model
            "messages": messageArray
        });
    } else if (apiType === 'anthropic') {
        
        apiUrl = 'https://api.anthropic.com/v1/complete';
        apiHeaders = {
            'Content-Type': 'application/json',
            'x-api-key': apiKey, // Correct header for Anthropic API key
            'anthropic-version': '2023-06-01'
        };
        apiBody = JSON.stringify({
            "model": apiModel, // Replace with your model
            "prompt": systemMessage + `\n\nHuman: ${inputText}\n\nAssistant:\n`,
            "max_tokens_to_sample": 2000
        });
    }

    try {
        let response = await fetch(apiUrl, {
            method: 'POST',
            headers: apiHeaders,
            body: apiBody
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch. Status code: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

chrome.runtime.onMessage.addListener(async function (request) {
    if (request.input) {
        // Add the user's message to the message array
        messageArray.push({ role: "user", "content": request.input });

        // Retrieve API type, key, and model from storage
        chrome.storage.local.get(['apiType', 'apiKey', 'apiModel'], async ({ apiType, apiKey, apiModel }) => {
            try {
                // Call the API
                let responseData = await handleApiRequest(apiType, apiKey, apiModel, request.input);

                // Process the response and extract the content
                let responseContent;
                if (apiType === 'openai' && responseData.choices && responseData.choices.length > 0) {
                    responseContent = responseData.choices[0].message.content;
                } else if (apiType === 'anthropic' && responseData.completion) {
                    responseContent = responseData.completion;
                }

                // Send the response back to the content script
                if (responseContent) {
                    chrome.runtime.sendMessage({ answer: responseContent });
                    messageArray.push({ role: "assistant", "content": responseContent });
                }
            } catch (error) {
                chrome.runtime.sendMessage({ answer: "Error processing your request." });
            }
        });
    }
    return true;
});