// const cds = require('@sap/cds');
// const solace = require('solclientjs');

// class SolaceService extends cds.MessagingService {
//     async init() {
//         const factoryProps = new solace.SolclientFactoryProperties();
//         factoryProps.profile = solace.SolclientFactoryProfiles.version10;
//         solace.SolclientFactory.init(factoryProps);

//         this.isConnected = false;
//         this.pendingSubscriptions = [];

//         this.session = solace.SolclientFactory.createSession({
//             url: process.env.SOLACE_URL || 'wss://mr-connection-08ni8ep7wjm.messaging.solace.cloud:443',
//             vpnName: process.env.SOLACE_VPN || 'demo',
//             userName: process.env.SOLACE_USERNAME || 'cy-techies-processes',
//             password: process.env.SOLACE_PASSWORD || 'Anil@1234',
//         });

//         this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
//             console.log("✅ Connected to Solace");

//             this.isConnected = true; this.isConnected = true;

//             // Subscribe pending topics
//             this.pendingSubscriptions.forEach(event => {
//                 this._subscribe(event);
//             });

//             this.pendingSubscriptions = [];
//         });


//         this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (err) => {
//             console.error("❌ Solace Connection Failed:", err);
//         });

//         this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
//             console.error("❌ Solace Disconnected");
//         });

//         this.session.on(solace.SessionEventCode.MESSAGE, async (message) => {
//             try {
//                 const raw = message.getBinaryAttachment();

//                 let data;
//                 if (raw instanceof Buffer) {
//                     data = JSON.parse(raw.toString());
//                 } else if (typeof raw === 'string') {
//                     data = JSON.parse(raw);
//                 } else {
//                     data = raw;
//                 }

//                 console.log("📩 Message received from Solace:", data);

//                 // Emit to CAP
//                 await super.emit({
//                     event: 'cy/techies/processes/completed',
//                     data
//                 });

//             } catch (err) {
//                 console.error("❌ Error parsing message:", err);
//             }
//         });

//         this.session.connect();
//         await super.init();
//     }

//     async emit(event, data) {
//         const msg = solace.SolclientFactory.createMessage();
//         msg.setDestination(solace.SolclientFactory.createTopic(event));
//         msg.setBinaryAttachment(JSON.stringify(data));
//         this.session.send(msg);
//         console.log("📤 Message sent to Solace:", event);
//     }

//     async on(event, handler) {
//         super.on(event, handler);

//         console.log(`📡 Subscribing to topic: ${event}`);

//         this.session.subscribe(
//             solace.SolclientFactory.createTopic(event),
//             true,
//             event,
//             10000
//         );
//     }
// }

// module.exports = SolaceService;


const cds = require('@sap/cds');
const solace = require('solclientjs');

class SolaceService extends cds.MessagingService {

    async init() {

        const factoryProps = new solace.SolclientFactoryProperties();
        factoryProps.profile = solace.SolclientFactoryProfiles.version10;
        solace.SolclientFactory.init(factoryProps);

        this.isConnected = false;
        this.pendingSubscriptions = [];

        this.session = solace.SolclientFactory.createSession({
            url: process.env.SOLACE_URL || 'wss://mr-connection-08ni8ep7wjm.messaging.solace.cloud:443',
            vpnName: process.env.SOLACE_VPN || 'demo',
            userName: process.env.SOLACE_USERNAME || 'cy-techies-processes',
            password: process.env.SOLACE_PASSWORD || 'Anil@1234',
        });

        // ✅ CONNECTED
        this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
            console.log("✅ Connected to Solace");

            this.isConnected = true;

            // Subscribe only AFTER connection
            this.pendingSubscriptions.forEach(event => {
                this._subscribe(event);
            });

            this.pendingSubscriptions = [];
        });

        // ❌ ERROR HANDLING
        this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (err) => {
            console.error("❌ Solace Connection Failed:", err);
        });

        this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
            console.error("❌ Solace Disconnected");
        });

        // ✅ MESSAGE HANDLER
        this.session.on(solace.SessionEventCode.MESSAGE, async (message) => {
            try {
                const raw = message.getBinaryAttachment();

                let data;
                if (raw instanceof Buffer) {
                    data = JSON.parse(raw.toString());
                } else if (typeof raw === 'string') {
                    data = JSON.parse(raw);
                } else {
                    data = raw;
                }

                console.log("📩 Message received from Solace:", data);

                // Emit to CAP
                await super.emit({
                    event: 'cy/techies/processes/completed',
                    data
                });

            } catch (err) {
                console.error("❌ Error parsing message:", err);
            }
        });

        this.session.connect();
        await super.init();
    }

    // ✅ SAFE SUBSCRIBE METHOD
    _subscribe(event) {
        console.log(`📡 Subscribing to topic: ${event}`);

        this.session.subscribe(
            solace.SolclientFactory.createTopic(event),
            true,
            event,
            10000
        );
    }

    async emit(event, data) {
        const msg = solace.SolclientFactory.createMessage();
        msg.setDestination(solace.SolclientFactory.createTopic(event));
        msg.setBinaryAttachment(JSON.stringify(data));

        this.session.send(msg);
        console.log("📤 Message sent:", event);
    }

    // ❗ FIXED: DO NOT SUBSCRIBE HERE
    async on(event, handler) {
        super.on(event, handler);

        console.log(`📝 Queued subscription for: ${event}`);

        // Only queue, do not subscribe yet
        this.pendingSubscriptions.push(event);
    }
}

module.exports = SolaceService;