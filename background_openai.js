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

// listen for a request message from the content script
chrome.runtime.onMessage.addListener(async function (request) {
    // check if the request contains a message that the user sent a new message
    if (request.input) {
        // get the API key from local storage
        let apiKey = await new Promise(resolve => chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey)));

        // get the API model from local storage
        let apiModel = await new Promise(resolve => chrome.storage.local.get(['apiModel'], result => resolve(result.apiModel)));

        // Add the user's message to the message array
        messageArray.push({ role: "user", "content": request.input });

        try {
            // send the request containing the messages to the OpenAI API
            let response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    "model": apiModel,
                    "messages": messageArray
                })
            });

            // check if the API response is ok Else throw an error
            if (!response.ok) {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }

            // get the data from the API response as json
            let data = await response.json();

            // check if the API response contains an answer
            if (data && data.choices && data.choices.length > 0) {
                // get the answer from the API response
                let response = data.choices[0].message.content;

                // send the answer back to the content script
                chrome.runtime.sendMessage({ answer: response });

                // Add the response from the assistant to the message array
                messageArray.push({ role: "assistant", "content": response });
            }
        } catch (error) {
            // send error message back to the content script
            chrome.runtime.sendMessage({ answer: "No answer Received: Make sure the entered API-Key is correct." });
        }
    }
    // return true to indicate that the message has been handled
    return true;
});
