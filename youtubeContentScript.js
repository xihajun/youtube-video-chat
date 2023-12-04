function timeToSeconds(time) {
    var parts = time.split(':');
    var seconds = 0;
    for (var i = 0; i < parts.length; i++) {
        seconds = seconds * 60 + parseInt(parts[i], 10);
    }
    return seconds;
}

function getAllTextBeforeTime(timeInSeconds) {
    var segments = document.querySelectorAll('.ytd-transcript-segment-renderer');
    var combinedText = '';

    segments.forEach(function(segment) {
        var timestampElement = segment.querySelector('.segment-timestamp');
        if (timestampElement) {
            var segmentTimeText = timestampElement.textContent.trim();
            var segmentTime = timeToSeconds(segmentTimeText);
            if (segmentTime <= timeInSeconds) {
                var transcriptText = segment.querySelector('.segment-text')?.textContent.trim();
                if (transcriptText) {
                    combinedText += transcriptText + ' ';
                }
            }
        }
    });

    return combinedText;
}

// Listen for a message from the popup
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getCombinedText") {
            var videoPlayer = document.querySelector('video');
            if (videoPlayer) {
                var currentTimeInSeconds = videoPlayer.currentTime;
                var combinedText = getAllTextBeforeTime(currentTimeInSeconds);
                // console.log(combinedText);
                sendResponse({text: combinedText});
            } else {
                sendResponse({text: 'Video player not found'});
            }
        }
    }
);