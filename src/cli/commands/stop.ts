import { stopDaemon } from "../../daemon/lifecycle.js";

export function stopCommand(): void {
  stopDaemon();
}
