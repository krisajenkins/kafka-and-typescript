import Kafka from "node-rdkafka";

console.log("START");

const consumer = new Kafka.KafkaConsumer(
    {
        "bootstrap.servers": "localhost:9092",
        "group.id": "confoo",
    },
    {
        "auto.offset.reset": "latest",
    }
);

const trainState = new Map();

function showTrainState() {
    const latestArrivals = Array.from(trainState.values())
        .filter((train) => new Date(train.timeToLive) >= new Date())
        .filter((train) => train.lineId === "piccadilly")
        .sort((a, b) => a.timeToStation - b.timeToStation)
        .slice(0, 15);

    console.clear();
    console.table(
        latestArrivals,
        [
            "towards",
            "currentLocation",
            "destinationName",
            "platformName",
            "expectedArrival",
        ]

    );
};

const watcher = setInterval(showTrainState, 1000);

consumer
    .on("ready", () => {
        console.log("READY");
        consumer.subscribe(["tfl_arrivals"]);
        consumer.consume();
    })
    .on("data", (data) => {
        if (data.value) {
            const value = JSON.parse(data.value.toString());
            trainState.set(value.id, value);
        }
    });

consumer.connect();

function shutdownHandler(signalName: string) {
    console.log("Shutting down", signalName);

    consumer.disconnect();
    clearInterval(watcher);

    console.log("END");
    process.exit(1);
};

process.on("SIGHUP", shutdownHandler);
process.on("SIGQUIT", shutdownHandler);
process.on("SIGINT", shutdownHandler);
process.on("SIGUSR2", shutdownHandler);
