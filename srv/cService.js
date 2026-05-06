const cds = require('@sap/cds');
const { GoogleGenAI } = require("@google/genai");
module.exports = cds.service.impl(async function () {
    // Connect to the custom messaging service defined in package.json 
    const messaging = await cds.connect.to('messaging');

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });
    /** 
     * Listener: TestTopicEP 
     * Handles incoming events from the Event Mesh and persists data to the database. 
     */
    messaging.on('cy/techies/processes/completed', async (msg) => {

        let data;
        let event;

        try {
            // 1️⃣ Parse payload
            data = msg.data || msg;

            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            console.log("📩 Received Event:", data);

            // 2️⃣ Insert into DB
            // await INSERT.into('my.app.ProcessEvents').entries({
            //     processId: data.processId,
            //     processType: data.processType,
            //     outcome: data.outcome,
            //     completedAt: new Date(),
            //     payload: JSON.stringify(data)
            // });

            // console.log("✅ Event stored successfully");

            event = {
                ID: cds.utils.uuid(),
                processId: data.processId,
                processType: data.processType,
                outcome: data.outcome,
                completedAt: new Date(),
                payload: JSON.stringify(data)
            };

            await INSERT.into('my.app.ProcessEvents')
                .entries(event);

        } catch (error) {
            console.error("❌ Error processing event:", error);
        }
        const prompt = `
Analyse this process completion event:

Process Type: ${data.processType}
Outcome: ${data.outcome}
Duration: ${data.duration || 120}

Provide:
1. One sentence summary
2. Sentiment (Positive/Neutral/Negative)
3. Two process improvement recommendations

Respond ONLY in valid JSON format like:

{
  "summary": "...",
  "sentiment": "...",
  "recommendations": [
    "...",
    "..."
  ]
}
`;

        console.log("🤖 Calling Gemini AI...");

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const aiText = response.text;

        console.log("🤖 AI Response:", aiText);
        let analysis;

        try {

            analysis = JSON.parse(aiText);

        } catch (err) {

            // Remove markdown if returned
            const cleaned = aiText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            analysis = JSON.parse(cleaned);
        }
        try {
            await INSERT.into('my.app.ProcessAnalysis').entries({

                ID: cds.utils.uuid(),
                event_ID: event.ID,
                summary: analysis.summary,
                recommendations: JSON.stringify(
                    analysis.recommendations
                ),

                sentiment: analysis.sentiment,

                analysedAt: new Date()
            });

            console.log("✅ Process analysis stored");

            if (data.outcome?.toLowerCase() === 'rejected') {

                const rejectedPayload = {

                    processId: data.processId,
                    processType: data.processType,
                    outcome: data.outcome,
                    summary: analysis.summary,
                    sentiment: analysis.sentiment,
                    analysedAt: new Date()
                };

                await messaging.emit(
                    'cy/techies/processes/rejected',
                    rejectedPayload
                );

                console.log(
                    "📤 Rejected follow-up event published"
                );
            }

        } catch (error) {

            console.error("❌ Error processing event:", error);

        }
    });

}); 