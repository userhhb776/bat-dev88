import { beforeEach, describe, expect, it } from "vitest";
import { createSiteTracking } from "@/lib/site-tracking";
import { validateGeneration } from "@/lib/forge-validation";
import { projectFiles, previewHtml } from "@/lib/forge";

describe("sales-page runtime", () => {
  beforeEach(() => { window.history.replaceState({}, "", "/?utm_source=meta&utm_campaign=launch&fbclid=abc&email=private&token=secret"); });
  it("forwards allowed attribution without leaking arbitrary query data or overriding checkout attribution", () => {
    const tracking = createSiteTracking(window, true);
    const url = new URL(tracking.attributedUrl("https://checkout.example/buy?utm_source=partner#offer"));
    expect(url.searchParams.get("utm_source")).toBe("partner");
    expect(url.searchParams.get("utm_campaign")).toBe("launch");
    expect(url.searchParams.get("fbclid")).toBe("abc");
    expect(url.searchParams.has("email")).toBe(false);
    expect(url.searchParams.has("token")).toBe(false);
    expect(url.hash).toBe("#offer");
    expect(tracking.attributedUrl("javascript:alert(1)")).toBe("javascript:alert(1)");
  });
  it("keeps WhatsApp attribution in the message and validates the phone", () => {
    const tracking = createSiteTracking(window, true);
    const url = new URL(tracking.whatsappUrl("+55 (11) 99999-9999", "Olá"));
    expect(url.pathname).toBe("/5511999999999");
    expect(url.searchParams.get("text")).toContain("utm_campaign=launch");
    expect(url.searchParams.has("utm_source")).toBe(false);
    expect(tracking.attributedUrl("https://wa.me/5511999999999?text=Oi")).toBe("https://wa.me/5511999999999?text=Oi");
    expect(() => tracking.whatsappUrl("123", "Oi")).toThrow();
  });
  it("simulates preview events without inserting a Meta script even after consent", () => {
    const tracking = createSiteTracking(window, true);
    tracking.configure({ pixelId: "123456789012345" }); tracking.setConsent(true); tracking.track("InitiateCheckout");
    expect(tracking.getState().simulated.map(e => e.event)).toEqual(["InitiateCheckout"]);
    expect(document.querySelector('script[src*="fbevents"]')).toBeNull();
  });
  it("blocks live Meta events before consent, emits PageView once and revokes events", () => {
    const iframe = document.createElement("iframe"); document.body.append(iframe);
    const win = iframe.contentWindow;
    if (!win) throw new Error("No window");
    const tracking = createSiteTracking(win);
    tracking.configure({ pixelId: "123456789012345" }); tracking.track("Lead");
    expect(win.document.querySelector('script[src*="fbevents"]')).toBeNull();
    tracking.setConsent(true); tracking.setConsent(true);
    const pixel = (win as Window & { fbq?: {queue?: unknown[][]} }).fbq;
    expect(pixel?.queue?.filter(args => args[1] === "PageView")).toHaveLength(1);
    tracking.track("Lead");
    expect(pixel?.queue?.filter(args => args[1] === "Lead")).toHaveLength(1);
    tracking.setConsent(false); tracking.track("Lead");
    expect(pixel?.queue?.filter(args => args[1] === "Lead")).toHaveLength(1);
    iframe.remove();
  });
  it("exports an executable shared runtime and simulates the same helper in preview", () => {
    const files = projectFiles("function App(){return <div/>}");
    const factory = new Function((files["src/site-tracking.js"] ?? "").replace("export const", "const") + "; return batTracking;");
    expect(factory().attribution().utm_source).toBe("meta");
    expect(previewHtml("function App(){return <div/>}")).toContain("batTracking:batTracking");
  });
});

describe("completed-source protection", () => {
  it("rejects provider failure even with a closed JSX block", () => {
    expect(validateGeneration('```jsx\nfunction App(){return <div/>}\n```\n[[BATDEV_ERRO:Disconnected]]').code).toBeNull();
  });
  it("rejects truncated or syntactically invalid output without guessing repairs", () => {
    expect(validateGeneration('```jsx\nfunction App(){return <div/>}').code).toBeNull();
    expect(validateGeneration('```jsx\nfunction App(){return <div className="broken>Oops</div>}\n```').code).toBeNull();
    expect(validateGeneration('```jsx\nfunction Other(){return <div/>}\n```').code).toBeNull();
  });
  it("accepts complete native interactive JSX", () => {
    const code = 'function App(){const [open,setOpen]=useState(false);return <button onClick={()=>setOpen(!open)}>{open ? "Sim" : "Não"}</button>}';
    expect(validateGeneration('```decisoes\nlayout: venda\n```\n```jsx\n'+code+'\n```')).toEqual({code,error:""});
  });
});