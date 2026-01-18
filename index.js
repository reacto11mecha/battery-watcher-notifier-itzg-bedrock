import { $ } from "bun";
const si = require("systeminformation");

// --- Configuration ---
const API_PATH = process.env.API_PATH;
const CONTAINER_NAME = process.env.ITZG_BEDROCK_SRV_CONTAINER_NAME;

if (!CONTAINER_NAME || CONTAINER_NAME === "") {
  console.error("Please give the check the env variable!");

  process.exit();
}

// --- State Tracking ---
let lastAnnouncedLevel = -1;
let lastCharging = null;

// Helper to send command to ITZG container
async function sendToMc(message) {
  try {
    console.info(`[MC SENDING] "${message}"`);
    // We use send-command as you confirmed it works for your container
    await $`docker exec ${CONTAINER_NAME} send-command say "${message}"`;
  } catch (err) {
    console.error(`[MC ERROR] Failed to send message: ${err.message}`);
  }
}

const battReportFn = async () => {
  try {
    // 1. Get Battery Data
    const { isCharging, percent } = await si.battery();
    const currentLevel = Math.floor(percent);

    // formatted print for dozzle (https://dozzle.dev/)
    console.info(JSON.stringify({ percent, isCharging }));

    // 2. Report to API (if API_PATH exist)
    if (API_PATH !== "") {
      const body = new FormData();
      body.set("percentage", currentLevel.toString());
      body.set("is_charging", isCharging ? "1" : "0");

      fetch(API_PATH, { method: "POST", body }).catch((e) =>
        console.error(`[API FAILED] ${e}`),
      );
    }

    // 3. Minecraft Notification Logic

    // --- FIRST RUN: Sync state only, announce online ---
    if (lastAnnouncedLevel === -1) {
      lastAnnouncedLevel = currentLevel;
      lastCharging = isCharging;

      const status = isCharging ? "Charging" : "On Battery";
      await sendToMc(
        `§b[System] Battery Monitor Online. Level: ${currentLevel}% (${status})`,
      );
      return;
    }

    // --- CHECK 1: Charging Status Changed? ---
    if (isCharging !== lastCharging) {
      const statusMsg = isCharging
        ? "§a Power Connected: Charging started."
        : "§c Power Disconnected: Running on battery.";

      await sendToMc(statusMsg);
      lastCharging = isCharging;
    }

    // --- CHECK 2: 10% Increment Check ---
    // We only announce if the level has changed AND it is a multiple of 10 (90, 80, 70...)
    // OR if it's critical (<= 10)
    if (currentLevel !== lastAnnouncedLevel) {
      const isDecade = currentLevel % 10 === 0; // Is it 90, 80, 70?
      const isCritical = currentLevel <= 10; // Always announce if 10% or lower

      if (isDecade || isCritical) {
        let lvlMsg = "";
        if (currentLevel > lastAnnouncedLevel) {
          lvlMsg = `§e Battery recharged to ${currentLevel}%`;
        } else {
          lvlMsg = `§6 Battery drops to ${currentLevel}%`;
        }

        await sendToMc(lvlMsg);
        // Update lastAnnouncedLevel ONLY when we announce.
        // This prevents spamming if it fluctuates between 79 and 80.
        lastAnnouncedLevel = currentLevel;
      }
    }
  } catch (error) {
    console.error(`[ERROR] ${error}`);
  }
};

// Run immediately
battReportFn();

// Run every 60 seconds
setInterval(() => battReportFn(), 60 * 1000);
