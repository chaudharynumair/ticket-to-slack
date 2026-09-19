module.exports = async function handler(req, res) {

    // Only allow POST requests
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

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


        // Validate required fields
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


        // Return trip must have return date
        if (
            tripType === "Return" &&
            !returnDate
        ) {
            return res.status(400).json({
                error: "Please select return date"
            });
        }


        // Generate random Booking ID
        const randomNumber = Math.floor(
            100000 + Math.random() * 900000
        );

        const bookingId =
            `BK-${randomNumber}`;


        // Get Slack webhook securely
        const webhookUrl =
            process.env.SLACK_WEBHOOK_URL;


        if (!webhookUrl) {

            console.error(
                "SLACK_WEBHOOK_URL is missing"
            );

            return res.status(500).json({
                error:
                    "Slack webhook is not configured"
            });
        }


        // Trip details
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


        // Send booking to Slack
        const slackResponse =
            await fetch(
                webhookUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            slackMessage
                        )
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
                error:
                    "Could not send booking to Slack"
            });
        }


        console.log(
            `Booking ${bookingId} sent to Slack`
        );


        return res.status(200).json({

            success: true,

            bookingId:
                bookingId

        });


    } catch (error) {

        console.error(
            "Booking Error:",
            error
        );


        return res.status(500).json({

            error:
                "Something went wrong"

        });

    }

};