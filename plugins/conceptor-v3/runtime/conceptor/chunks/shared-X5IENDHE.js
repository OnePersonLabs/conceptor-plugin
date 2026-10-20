import {
  SqliteObservationSourceCapture
} from "./shared-TTCVR66Q.js";
import {
  hydrateInventory
} from "./shared-6SRSD4VD.js";

// node_modules/@conceptor/control-plane/dist/observation/source-inventory.js
function hydrateCapturedInventory(inventory) {
  const descriptor = inventory.contentStore;
  if (descriptor?.schemaVersion !== "projector.source-content/v2")
    return hydrateInventory(inventory);
  const capture = SqliteObservationSourceCapture.open(descriptor);
  try {
    const entries = capture.entries(descriptor.paths);
    return { inventory: { ...inventory, entries }, close: () => capture.close() };
  } catch (error) {
    capture.close();
    throw error;
  }
}

export {
  hydrateCapturedInventory
};
