export async function onRequestPost(context) {
    try {
        const booking = await context.request.json();

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
        } = booking;

        // Required fields
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
            return jsonResponse(
                { error: "Please fill all required fields" },
                400
            );
        }

        // Return trip requires return date
        if (tripType === "Return" && !returnDate) {
            return jsonResponse(
                { error: "Please select return date" },
                400
            );
        }

        // Random Booking ID
        const randomNumber = Math.floor(
            100000 + Math.random() * 900000
        );

        const bookingId = `BK-${randomNumber}`;

        // Slack webhook stored in Cloudflare secret
        const webhookUrl = context.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            console.error("SLACK_WEBHOOK_URL is missing");

            return jsonResponse(
                { error: "Slack webhook is not configured" },
                500
            );
        }

        // Trip details
        let tripDetails =
`🛫 *Trip:* ${tripType}
📅 *Travel Date:* ${travelDate}`;

        if (tripType === "Return" && returnDate) {
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
            const errorText = await slackResponse.text();

            console.error(
                "Slack Error:",
                errorText
            );

            return jsonResponse(
                { error: "Could not send booking to Slack" },
                500
            );
        }

        console.log(
            `Booking ${bookingId} sent to Slack`
        );

        return jsonResponse({
            success: true,
            bookingId: bookingId
        });

    } catch (error) {
        console.error(
            "Booking Error:",
            error
        );

        return jsonResponse(
            { error: "Something went wrong" },
            500
        );
    }
}


// Helper for JSON responses
function jsonResponse(data, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status: status,
            headers: {
                "Content-Type": "application/json"
            }
        }
    );
}