const cds = require('@sap/cds');
module.exports = cds.service.impl(async function () {
    // Connect to the custom messaging service defined in package.json 
    const messaging = await cds.connect.to('messaging');
    /** 
     * Listener: TestTopicEP 
     * Handles incoming events from the Event Mesh and persists data to the database. 
     */
    messaging.on('cy/techies/processes/completed', async (msg) => {


        try {
            // 1️⃣ Parse payload
            let data = msg.data;

            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            console.log("📩 Received Event:", data);

            // 2️⃣ Insert into DB
            await INSERT.into('my.app.ProcessEvents').entries({
                processId: data.processId,
                processType: data.processType,
                outcome: data.outcome,
                completedAt: new Date(),
                payload: JSON.stringify(data)
            });

            console.log("✅ Event stored successfully");

        } catch (error) {
            console.error("❌ Error processing event:", error);
        }

        // const data = msg.data;

        // console.log("Event Received:", data);

        // // 1. Store Process Event
        // const event = await INSERT.into('my.app.ProcessEvents').entries({
        //     processId: data.processId,
        //     processType: data.processType,
        //     outcome: data.outcome,
        //     completedAt: new Date(),
        //     payload: JSON.stringify(data)
        // });

        // 2. Call AI (Mock / Replace with real API)
        // const aiResponse = await callAI(data);

        // // 3. Store AI Analysis
        // await INSERT.into('my.app.ProcessAnalysis').entries({
        //     event_ID: event.ID,
        //     summary: aiResponse.summary,
        //     recommendations: aiResponse.recommendations,
        //     sentiment: aiResponse.sentiment,
        //     analysedAt: new Date()
        // });

        // 4. Optional: Publish rejected event
        // if (data.outcome === "Rejected") {
        //     await messaging.emit('cy/techies/processes/rejected', data);
        // }
    });

}); 