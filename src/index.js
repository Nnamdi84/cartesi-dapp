import { ROLLUP_SERVER } from "./shared/config";
import { hexToString } from "viem";
import { RollupStateHandler } from "./shared/rollup-state-handler";
import { controller } from "./controller";

const rollupServer = ROLLUP_SERVER;
console.log("HTTP rollup_server URL is " + rollupServer);

/**
 * ### Incoming advance data common schema:
 * @param {*} data {
 *     "metadata": {
 *         "msg_sender": "0x...",
 *         "epoch_index": number,
 *         "input_index": number,
 *         "block_number": number,
 *         "timestamp": number
 *     },
 *     "payload": "0x..."
 *   }
 */
async function handleAdvance(data) {
    console.log("Received advance raw data ->", JSON.stringify(data));
    const payloadRaw = hexToString(data.payload);
    const payload = JSON.parse(payloadRaw);
    const { action: requestedAction, data: providedData } = payload;

    const action = controller[requestedAction] || controller.logData;

    if (!action) {
        return await RollupStateHandler.handleReport({
            error: `Action '${requestedAction}' not allowed.`,
        });
    }

    return await action(providedData);
}

/**
 * ### Incoming inspect data common schema:
 * @param {*} data {"payload": "0x..."}
 */
async function handleInspect(data) {
    console.log("Received inspect raw data ->", JSON.stringify(data));
    const urlParams = hexToString(data.payload);
    const [requestedAction, ...providedData] = urlParams.split("/");
    const action = controller[requestedAction] || controller.logData;

    if (!action) {
        return await RollupStateHandler.handleReport({
            error: `Action '${requestedAction}' not allowed.`,
        });
    }

    return await action(providedData);
}

const handlers = {
    advance_state: handleAdvance,
    inspect_state: handleInspect,
};

const finish = { status: "accept" };

(async () => {
    while (true) {
        const finishReq = await fetch(rollupServer + "/finish", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(finish),
        });

        console.log("Received finish status " + finishReq.status);

        if (finishReq.status === 202) {
            console.log("No pending rollup request, trying again");
        } else {
            const rollupReq = await finishReq.json();
            const handler = handlers[rollupReq.request_type];
            finish.status = await handler(rollupReq.data);
        }
    }
})();
