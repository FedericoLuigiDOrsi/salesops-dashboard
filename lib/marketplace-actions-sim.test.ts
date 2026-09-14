import { describe, expect, it, vi } from "vitest";
import { createSimulatedDriver, gateFor } from "./marketplace-actions-sim";

const T0 = 1_000_000;

function setup(settings = {}) {
  let t = T0;
  const clock = { advance: (ms: number) => (t += ms) };
  const driver = createSimulatedDriver({ now: () => t, random: () => 0, settings });
  return { driver, clock };
}

const offer = (id: string, marketplace: "vinted" | "depop" = "vinted") => ({
  kind: "offer_accept" as const,
  marketplace,
  target: { type: "offer" as const, id },
});

describe("gateFor", () => {
  it("usa le attese per classe e le divide per la velocità", () => {
    expect(gateFor("offer_accept", () => 0, 1)).toBe(15_000);
    expect(gateFor("offer_accept", () => 1, 1)).toBe(45_000);
    expect(gateFor("like_outreach", () => 0, 1)).toBe(30_000);
    expect(gateFor("like_outreach", () => 1, 1)).toBe(120_000);
    expect(gateFor("delist", () => 0, 1)).toBe(240_000);
    expect(gateFor("offer_accept", () => 0, 10)).toBe(1_500);
  });
});

describe("createSimulatedDriver", () => {
  it("porta un'azione da in coda a fatta rispettando attesa e durata", () => {
    const { driver, clock } = setup();
    const action = driver.submit(offer("off-1"));
    expect(action.state).toBe("pending");

    clock.advance(14_999);
    driver.tick();
    expect(driver.getSnapshot()[0].state).toBe("pending");

    clock.advance(1);
    driver.tick();
    expect(driver.getSnapshot()[0].state).toBe("submitting");

    clock.advance(2_000);
    driver.tick();
    expect(driver.getSnapshot()[0].state).toBe("done");
  });

  it("applica l'esito forzato una volta sola", () => {
    const { driver, clock } = setup({ nextOutcome: "failed" });
    driver.submit(offer("off-1"));
    clock.advance(15_000);
    driver.tick();
    clock.advance(2_000);
    driver.tick();
    expect(driver.getSnapshot()[0]).toMatchObject({ state: "failed", lastError: "Errore simulato" });
    expect(driver.getSettings().nextOutcome).toBe("done");
  });

  it("con l'estensione spenta non prende niente", () => {
    const { driver, clock } = setup({ extensionOn: false });
    driver.submit(offer("off-1"));
    clock.advance(600_000);
    driver.tick();
    expect(driver.getSnapshot()[0].state).toBe("pending");
  });

  it("senza account collegato non prende niente", () => {
    const { driver, clock } = setup({ accountConnected: false });
    driver.submit(offer("off-1"));
    clock.advance(600_000);
    driver.tick();
    expect(driver.getSnapshot()[0].state).toBe("pending");
  });

  it("prende una sola azione alla volta per piattaforma", () => {
    const { driver, clock } = setup();
    driver.submit(offer("off-1"));
    driver.submit(offer("off-2"));
    driver.submit(offer("off-3", "depop"));
    clock.advance(15_000);
    driver.tick();
    const states = driver.getSnapshot().map((a) => `${a.target.id}:${a.state}`);
    expect(states).toEqual(["off-1:submitting", "off-2:pending", "off-3:submitting"]);
  });

  it("annulla in coda, e dice troppo tardi dopo la presa forzata", async () => {
    const { driver } = setup();
    const a = driver.submit(offer("off-1"));
    await expect(driver.cancel(a.id)).resolves.toBe("cancelled");

    const b = driver.submit(offer("off-2"));
    driver.claimNow(b.id);
    await expect(driver.cancel(b.id)).resolves.toBe("too_late");
  });

  it("un captcha blocca la piattaforma finché non si riprende", () => {
    const { driver, clock } = setup({ nextOutcome: "awaiting_challenge" });
    driver.submit(offer("off-1"));
    driver.submit(offer("off-2"));
    clock.advance(15_000);
    driver.tick();
    clock.advance(2_000);
    driver.tick();
    driver.tick();
    expect(driver.getSnapshot().map((a) => a.state)).toEqual(["awaiting_challenge", "pending"]);

    driver.resume("vinted");
    driver.tick();
    expect(driver.getSnapshot().map((a) => a.state)).toEqual(["submitting", "pending"]);
  });

  it("riprova un'azione fallita", () => {
    const { driver, clock } = setup({ nextOutcome: "failed" });
    const a = driver.submit(offer("off-1"));
    clock.advance(15_000);
    driver.tick();
    clock.advance(2_000);
    driver.tick();
    driver.retry(a.id);
    expect(driver.getSnapshot()[0]).toMatchObject({ state: "pending", attempts: 1 });
  });

  it("avvisa i lettori solo quando qualcosa cambia", () => {
    const { driver } = setup();
    const onChange = vi.fn();
    const unsubscribe = driver.subscribe(onChange);
    const before = driver.getSnapshot();
    driver.tick();
    expect(driver.getSnapshot()).toBe(before);
    expect(onChange).not.toHaveBeenCalled();

    driver.submit(offer("off-1"));
    expect(onChange).toHaveBeenCalledTimes(1);

    driver.updateSettings({ speed: 10 });
    expect(onChange).toHaveBeenCalledTimes(2);

    unsubscribe();
    driver.clear();
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(driver.getSnapshot()).toEqual([]);
  });
});
