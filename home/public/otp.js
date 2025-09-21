// Global arrays to store coordinates
const xCoordinatesArray = [];
const yCoordinatesArray = [];
const sessionStart = Date.now();
const keyTimesArray = [];

document.addEventListener("DOMContentLoaded", function () {
    const aadhaarInput = document.getElementById("phone");

    aadhaarInput.addEventListener("input", function () {
        let value = this.value.replace(/\s/g, ''); // Remove existing spaces
        value = value.replace(/\D/g, ''); // Remove non-numeric characters

        let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value; // Add spaces after every 4 digits
        this.value = formattedValue;
    });
});

// Force immediate execution and tracking
(function() {
    console.log("Immediate tracking initialization");
    
    // Clear any existing handlers to prevent conflicts
    if (window.mouseMoveHandler) {
        document.removeEventListener('mousemove', window.mouseMoveHandler);
    }
    
    // Define our handler function
    window.mouseMoveHandler = function(event) {
        const x = event.clientX;
        const y = event.clientY;
        
        xCoordinatesArray.push(x);
        yCoordinatesArray.push(y);
        
        // Log collection progress
        if (xCoordinatesArray.length % 50 === 0) {
            console.log(`Tracking active: ${xCoordinatesArray.length} points collected`);
        }
    };
    
    // Attach the handler using both methods for redundancy
    document.addEventListener('mousemove', window.mouseMoveHandler);
    document.onmousemove = window.mouseMoveHandler;
    
    // Also track mouse enter events for guaranteed capture
    document.addEventListener('mouseenter', function(event) {
        console.log("Mouse entered document - ensuring tracking is active");
        // Re-attach handler if needed
        document.addEventListener('mousemove', window.mouseMoveHandler);
        document.onmousemove = window.mouseMoveHandler;
    });
    
    // Make sure tracking persists across navigation
    window.addEventListener('beforeunload', function() {
        // Store count in sessionStorage to verify tracking across refreshes
        sessionStorage.setItem('trackingCount', xCoordinatesArray.length.toString());
        console.log(`Before unload: ${xCoordinatesArray.length} points collected`);
    });
    
    // Check if we're coming back from a refresh
    window.addEventListener('load', function() {
        const previousCount = sessionStorage.getItem('trackingCount');
        console.log(`Page loaded. Previous tracking count: ${previousCount || 'none'}`);
        
        // Force mouse tracking to be active
        document.addEventListener('mousemove', window.mouseMoveHandler);
        document.onmousemove = window.mouseMoveHandler;
        
        // Debug logging
        console.log("Verified mouse tracking is active after page load");
    });
})();

// Original functions remain but with improved reliability
function sendOTP() {
    const aadhar = document.getElementById('phone').value.replace(/\s/g, '')
    if(/^\d{12}$/.test(aadhar)){
        document.getElementById("sendOtp").style.display = "none";
        let otpSection = document.getElementById("otpSection");
        otpSection.style.visibility = "visible";
        otpSection.style.height = "auto";
        startTimer();
    
        // Log current tracking status
        console.log(`sendOTP called: ${xCoordinatesArray.length} points collected so far`);
    }else{
        alert("Invalid Aadhar number, must be 12 digits")
        return false
    }
}

function startTimer() {
    let timeLeft = 60;
    let timerElement = document.getElementById("timer");
    let timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerElement.innerHTML = "Time expired! Request OTP again.";
        } else {
            timerElement.innerHTML = `Time left: ${timeLeft}s`;
            timeLeft--;
        }
    }, 1000);
}

function verifyOTP() {
    const otp = document.getElementById('otp').value
    if(/^\d{5}$/.test(otp)){
        // Log before verification
        console.log(`VERIFY: Total coordinates collected: ${xCoordinatesArray.length}`);

        //-----------------------------------------------------
        // Calculate typing metrics with improved accuracy
        const sessionDuration = Date.now() - sessionStart;
        
        // Handle case where no keys were pressed
        const typingMetrics = calculateTypingMetrics(keyTimesArray);
        //-----------------------------------------------------

        // Temporarily pause tracking during submission
        const originalHandler = window.mouseMoveHandler;
        document.removeEventListener('mousemove', window.mouseMoveHandler);
        document.onmousemove = null;
        
        // Create data package
        const metrics = {
            sessionDuration: sessionDuration,
            xCoordinates: xCoordinatesArray,
            yCoordinates: yCoordinatesArray,
            typingSpeed: typingMetrics.typingSpeed,
            interKeyDelayAvg: typingMetrics.interKeyDelayAvg,
            // Add additional metrics for better analysis
            totalKeystrokes: keyTimesArray.length,
            typingSpeedCPM: typingMetrics.typingSpeedCPM
        };
        
        // Send data to server
        sendData(metrics);
        
        // Resume tracking after a brief pause to ensure the send completes
        setTimeout(function() {
            document.addEventListener('mousemove', originalHandler);
            document.onmousemove = originalHandler;
        }, 500);
    }else{
        alert("Invalid OTP, must be 5 digits")
        return false
    }
}

// New function to calculate typing metrics more accurately
function calculateTypingMetrics(keyTimes) {
    // Default values if no keystrokes recorded
    if (!keyTimes || keyTimes.length === 0) {
        return {
            typingSpeed: 0,
            interKeyDelayAvg: 0,
            typingSpeedCPM: 0
        };
    }
    
    // Need at least 2 keystrokes to calculate speed
    if (keyTimes.length === 1) {
        return {
            typingSpeed: 0,
            interKeyDelayAvg: 0,
            typingSpeedCPM: 0
        };
    }
    
    const firstTypedTime = keyTimes[0];
    const lastTypedTime = keyTimes[keyTimes.length - 1];
    const typingDurationMs = lastTypedTime - firstTypedTime;
    
    // Avoid division by zero
    if (typingDurationMs === 0) {
        return {
            typingSpeed: 0,
            interKeyDelayAvg: 0,
            typingSpeedCPM: 0
        };
    }
    
    // Calculate typing speed in keystrokes per second
    const typingSpeedPerSecond = (keyTimes.length / typingDurationMs) * 1000;
    
    // Calculate characters per minute (CPM) - a more standard typing metric
    const typingSpeedCPM = typingSpeedPerSecond * 60;
    
    // Calculate average delay between keystrokes more accurately
    let interKeyDelaySum = 0;
    for (let i = 0; i < keyTimes.length - 1; i++) {
        interKeyDelaySum += keyTimes[i + 1] - keyTimes[i];
    }
    
    // Divide by number of delays (not number of keystrokes)
    const interKeyDelayAvg = keyTimes.length > 1 ? 
        Math.round(interKeyDelaySum / (keyTimes.length - 1)) : 0;
    
    return {
        // Keep the original metric for backward compatibility
        typingSpeed: typingSpeedPerSecond,
        interKeyDelayAvg: interKeyDelayAvg,
        typingSpeedCPM: Math.round(typingSpeedCPM)
    };
}

function sendData(data) {
    console.log(`Sending ${data.xCoordinates.length} coordinate pairs to server`);
    console.log(`Typing metrics - Speed: ${data.typingSpeed.toFixed(2)} keys/sec (${data.typingSpeedCPM} CPM), Avg delay: ${data.interKeyDelayAvg}ms`);
    
    // Show warning for debugging
    if (data.xCoordinates.length < 10) {
        console.warn("WARNING: Very few coordinates collected. This may indicate a tracking issue.");
    }
    
    // First, create loading overlay
    showLoadingOverlay();
    
    // Send data to your existing endpoint to store it
    fetch('http://localhost:3000/api/mouse-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(result => {
        console.log('Data stored successfully:', result);
        
        // Now send to ML prediction endpoint
        return fetch('http://localhost:3001/api/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    })
    .then(response => response.json())
    .then(prediction => {
        console.log('Bot prediction result:', prediction);
        
        // Handle the prediction result
        if (prediction.success) {
            const botProbability = (prediction.botProbability * 100).toFixed(2);
            const isBot = prediction.isBot;
            
            // Display result overlay
            showResultOverlay(isBot, botProbability);
            
            // Set timer to dispose homepage after showing result
            setTimeout(() => {
                disposeHomePage();
            }, 3000); // Wait 3 seconds before disposing
        } else {
            console.error('Error in bot prediction:', prediction.error);
            showResultOverlay(true, 90); // Default to bot detection on error
        }
        
        // Clear arrays after successful processing
        xCoordinatesArray.length = 0;
        yCoordinatesArray.length = 0;
        keyTimesArray.length = 0;
    })
    .catch(error => {
        console.error('Error in data processing pipeline:', error);
        // Show error overlay
        showErrorOverlay();
    });
}

// Function to show loading overlay
function showLoadingOverlay() {
    // Create overlay div if it doesn't exist
    let overlay = document.getElementById('verification-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'verification-overlay';
        document.body.appendChild(overlay);
    }
    
    // Set overlay style
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'Arial, sans-serif';
    
    // Set loading content
    overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2 style="margin-bottom: 20px; color: white;">Verifying User...</h2>
            <div class="spinner" style="border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; margin: 0 auto; animation: spin 1s linear infinite;"></div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
}

// Function to show verification result overlay
function showResultOverlay(isBot, confidence) {
    // Get or create overlay div
    let overlay = document.getElementById('verification-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'verification-overlay';
        document.body.appendChild(overlay);
    }
    
    // Set overlay style
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = isBot ? 'rgba(220, 53, 69, 0.9)' : 'rgba(40, 167, 69, 0.9)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'Arial, sans-serif';
    
    // Set content based on result
    if (isBot) {
        overlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                <h1 style="font-size: 36px; margin-bottom: 10px;">Bot Activity Detected</h1>
                <p style="font-size: 18px; margin-bottom: 20px;">Our systems have detected automated behavior.</p>
                <p style="font-size: 14px; opacity: 0.8;">Confidence: ${confidence}%</p>
            </div>
        `;
    } else {
        overlay.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                </svg>
                <h1 style="font-size: 36px; margin-bottom: 10px;">Human Verified</h1>
                <p style="font-size: 18px; margin-bottom: 20px;">Thank you for verifying your identity.</p>
                <p style="font-size: 14px; opacity: 0.8;">Confidence: ${(100-confidence).toFixed(2)}%</p>
            </div>
        `;
    }
}

// Function to show error overlay
function showErrorOverlay() {
    // Get or create overlay div
    let overlay = document.getElementById('verification-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'verification-overlay';
        document.body.appendChild(overlay);
    }
    
    // Set overlay style
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'Arial, sans-serif';
    
    // Set error content
    overlay.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            <h1 style="font-size: 36px; margin-bottom: 10px;">Verification Error</h1>
            <p style="font-size: 18px; margin-bottom: 20px;">Something went wrong during verification.</p>
            <p style="font-size: 14px; opacity: 0.8;">Please try again later.</p>
        </div>
    `;
}

// Function to dispose homepage
function disposeHomePage() {
    // This will redirect to a blank page, effectively disposing the homepage
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#f8f9fa';
    
    // Keep only the verification result
    const overlay = document.getElementById('verification-overlay');
    if (overlay) {
        overlay.style.position = 'absolute';
        overlay.style.height = '100vh';
    }
}

// Function to handle keystrokes (kept for compatibility)
function handleKeyPress(event) {
    const keyData = {
        key: event.key,
        timestamp: Date.now(),
    };
    keyTimesArray.push(keyData.timestamp);
    console.log('Keystroke:', keyData);
}

// Add keystroke listener
document.addEventListener('keydown', handleKeyPress);