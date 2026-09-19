const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));


// Generate Random Booking ID
function generateBookingId() {
    const number = Math.floor(
        100000 + Math.random() * 900000
    );

    return `BK-${number}`;
}


// Booking API
app.post("/api/booking", async (req, res) => {

    try {

        const {
            name,
            airline,
            flight,
            route,
            tripType,
            travelDate,
            returnDate,
            cabin,
            sellingPrice,
            currency
        } = req.body;


        // Basic validation
        if (
            !name ||
            !airline ||
            !flight ||
            !route ||
            !tripType ||
            !travelDate ||
            !cabin ||
            !sellingPrice
        ) {
            return res.status(400).json({
                error: "Please fill all required fields"
            });
        }


        // Return booking must have return date
        if (
            tripType === "Return" &&
            !returnDate
        ) {
            return res.status(400).json({
                error: "Please select return date"
            });
        }


        const bookingId = generateBookingId();

        const webhookUrl =
            process.env.SLACK_WEBHOOK_URL;


        if (!webhookUrl) {

            console.error(
                "SLACK_WEBHOOK_URL is missing"
            );

            return res.status(500).json({
                error: "Slack webhook is not configured"
            });
        }


        // Trip / Date section
        let tripDetails =
`🛫 *Trip:* ${tripType}
📅 *Travel Date:* ${travelDate}`;


        if (
            tripType === "Return" &&
            returnDate
        ) {
            tripDetails +=
`\n📅 *Return Date:* ${returnDate}`;
        }


        // Slack message
        const slackMessage = {
            text:
`✈️ *NEW BOOKING*

🆔 *Booking ID:* ${bookingId}
👤 *Name:* ${name}

✈️ *Airline:* ${airline}
🔢 *Flight:* ${flight}
🌍 *Route:* ${route}

${tripDetails}

💺 *Cabin:* ${cabin}
💰 *Selling Price:* ${currency || "PKR"} ${Number(
    sellingPrice
).toLocaleString()}`
        };


        // Send to Slack
        const slackResponse = await fetch(
            webhookUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(slackMessage)
            }
        );


        if (!slackResponse.ok) {

            const errorText =
                await slackResponse.text();

            console.error(
                "Slack Error:",
                errorText
            );

            return res.status(500).json({
                error: "Could not send booking to Slack"
            });
        }


        console.log(
            `✅ Booking ${bookingId} sent to Slack`
        );


        return res.json({
            success: true,
            bookingId: bookingId
        });


    } catch (error) {

        console.error(
            "Booking Error:",
            error
        );

        return res.status(500).json({
            error: "Something went wrong"
        });
    }

});


// Start Server
app.listen(PORT, () => {

    console.log(
        `Booking Portal running on port ${PORT}`
    );

});