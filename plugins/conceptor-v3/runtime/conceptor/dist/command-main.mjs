#!/usr/bin/env node
import {
  runPublicCommand
} from "../chunks/shared-FEQI2ND4.js";
import {
  createBundledProjectorOperationRunner
} from "../chunks/shared-ME676ZMM.js";
import "../chunks/shared-NQZURG2P.js";
import "../chunks/shared-VEBMHGK2.js";
import "../chunks/shared-DUEELWPX.js";
import "../chunks/shared-D47KLSX5.js";
import "../chunks/shared-OFD4MU4R.js";
import "../chunks/shared-LHKD2GMY.js";
import "../chunks/shared-TAVWM7OV.js";
import "../chunks/shared-BLXCSKYS.js";
import "../chunks/shared-TMMS5AAN.js";
import "../chunks/shared-JNVJDF6D.js";
import "../chunks/shared-RBDP6LFA.js";
import "../chunks/shared-XIRYQBRQ.js";
import "../chunks/shared-GOCL4YYW.js";
import "../chunks/shared-HL6MCTMP.js";
import "../chunks/shared-KIG4DOII.js";
import "../chunks/shared-S26VDME2.js";
import "../chunks/shared-K5W6WSUS.js";
import "../chunks/shared-X5IENDHE.js";
import "../chunks/shared-Z5YPJGJJ.js";
import "../chunks/shared-TTCVR66Q.js";
import "../chunks/shared-6SRSD4VD.js";
import "../chunks/shared-ZDS6IOGX.js";
import "../chunks/shared-GUMNUOTD.js";
import "../chunks/shared-JK2RIYKJ.js";
import "../chunks/shared-QAVVEQAL.js";
import "../chunks/shared-72EROCIW.js";
import "../chunks/shared-ZIFGP2AB.js";
import "../chunks/shared-WC2OT3WX.js";

// dist/command-main.mjs
import { fileURLToPath } from "node:url";
try {
  const packagedRoot = fileURLToPath(new URL("..", import.meta.url));
  const runner = await createBundledProjectorOperationRunner({ packagedRoot });
  const result = await runPublicCommand(process.argv.slice(2), { runner: { execute: (request) => runner.execute(request, { environment: process.env }) }, cwd: process.cwd() });
  process.stdout.write(result.text);
  process.exitCode = result.exitCode;
} catch (error) {
  process.stderr.write(String(error.message ?? error) + "\n");
  process.exitCode = 2;
}
