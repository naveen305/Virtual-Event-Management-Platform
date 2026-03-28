/**
 * Mock Email Service to simulate asynchronous operations.
 * 
 * This service uses a Promise and a timeout to mimic real-world email
 * sending tasks (like communicating with a remote SMTP or API server).
 */

const sendRegistrationEmail = (userEmail, eventTitle) => {
    return new Promise((resolve) => {
        console.log(`[EmailService] Preparing notification for ${userEmail}...`);
        
        // Simulate network delay of 1.5 seconds
        setTimeout(() => {
            console.log(`[EmailService] SUCCESS: Confirmation for "${eventTitle}" sent to ${userEmail}.`);
            resolve(true);
        }, 1500);
    });
};

module.exports = { sendRegistrationEmail };
