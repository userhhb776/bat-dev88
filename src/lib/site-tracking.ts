/** Self-contained browser runtime: shared verbatim by iframe and portable exports. */
export function createSiteTracking(win: Window, preview = false) {
  type Pixel = ((...args: unknown[]) => void) & { queue?: unknown[][]; callMethod?: (...args: unknown[]) => void; push?: Pixel; loaded?: boolean; version?: string };
  const host = win as Window & { fbq?: Pixel; _fbq?: Pixel };
  let pixelId = "", consent = false, initialized = "", pageViewed = false;
  const simulated: { event: string; params: Record<string, unknown> }[] = [];
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid", "msclkid", "src", "sck"];
  function attribution() {
    const out: Record<string, string> = {};
    const search = new URL(host.location.href).searchParams;
    for (const key of keys) {
      const value = search.get(key);
      if (value && value.length <= 500) out[key] = value;
    }
    return out;
  }
  function attributedUrl(value: string) {
    try {
      const url = new URL(value, host.location.href);
      if (!["http:", "https:"].includes(url.protocol)) return value;
      // WhatsApp attribution belongs in the message, not undocumented query fields.
      if (["wa.me", "api.whatsapp.com", "web.whatsapp.com"].includes(url.hostname)) return value;
      for (const [key, val] of Object.entries(attribution())) if (!url.searchParams.has(key)) url.searchParams.set(key, val);
      return url.href;
    } catch { return value; }
  }
  function whatsappUrl(phone: string, message: string) {
    const digits = phone.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(digits)) throw new Error("Informe o WhatsApp com código do país e DDD.");
    const values = Object.entries(attribution());
    const suffix = values.length ? "\n\nOrigem: " + values.map(([key, val]) => `${key}=${val}`).join(" & ") : "";
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(message + suffix);
  }
  function track(event: string, params: Record<string, unknown> = {}) {
    if (preview) { simulated.push({ event, params }); return; }
    if (!consent || !initialized || !host.fbq) return;
    const standard = ["PageView", "ViewContent", "Lead", "Contact", "InitiateCheckout", "AddToCart", "Purchase", "CompleteRegistration"];
    host.fbq(standard.includes(event) ? "track" : "trackCustom", event, params);
  }
  function start() {
    if (preview || !consent || !pixelId || initialized) return;
    if (!host.fbq) {
      const pixel: Pixel = function (...args: unknown[]) {
        if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue?.push(args);
      };
      pixel.push = pixel; pixel.loaded = true; pixel.version = "2.0"; pixel.queue = [];
      host.fbq = pixel; host._fbq = pixel;
      const script = host.document.createElement("script");
      script.async = true; script.src = "https://connect.facebook.net/en_US/fbevents.js";
      host.document.head.appendChild(script);
    }
    host.fbq("consent", "grant");
    host.fbq("init", pixelId);
    initialized = pixelId;
    if (!pageViewed) { track("PageView"); pageViewed = true; }
  }
  return {
    configure(config: { pixelId?: string }) {
      const id = config.pixelId?.trim() ?? "";
      if (id && !/^\d{5,25}$/.test(id)) throw new Error("ID do Meta Pixel inválido.");
      if (initialized && id !== initialized) throw new Error("Recarregue a página para trocar o Meta Pixel.");
      pixelId = id; start();
    },
    setConsent(accepted: boolean) {
      consent = accepted === true;
      if (!preview && host.fbq) host.fbq("consent", consent ? "grant" : "revoke");
      if (consent) start();
    },
    attribution, attributedUrl, whatsappUrl, track,
    getState() { return { preview, consent, pixelId, initialized, simulated: [...simulated] }; },
  };
}

export const trackingPrompt = `
## Páginas de vendas, conversão e rastreamento
- Atue também como copywriter/CRO: adapte promessa clara, oferta, benefícios, demonstração ou VSL fornecida, objeções/FAQ e CTAs ao produto e à intenção do tráfego. Não force todas as seções nem crie vídeo inexistente.
- Nunca invente resultados, depoimentos, escassez, contagem regressiva que reinicia, descontos, preço anterior, bônus ou garantia de 7/30 dias. Use somente fatos fornecidos; peça os dados essenciais que faltam. Rascunhos precisam ser identificados como demonstração na conversa.
- Checkout e WhatsApp usam destinos reais fornecidos. Formulário só confirma envio após resposta real bem-sucedida; demo não coleta nem finge salvar. Carrinho, FAQ, menu e modais precisam funcionar por estado React, com labels, foco e fechamento acessíveis.
- O objeto global batTracking já existe no preview e no ZIP/Vercel. Não importe biblioteca de tracking e NÃO injete script/fbq/noscript manualmente.
- Somente se pedirem Pixel e fornecerem um ID real: useEffect(() => { batTracking.configure({pixelId: "ID_FORNECIDO"}); }, []). Antes de consentimento explícito não há Pixel real. Crie controles de aceitar, recusar e revogar chamando batTracking.setConsent(true/false). Não assuma consentimento nem envie email/telefone ou outros dados pessoais para o Pixel.
- Eventos: PageView é automático após consentimento. batTracking.track("InitiateCheckout") só no clique de checkout; Contact no WhatsApp; Lead somente após envio confirmado; Purchase apenas após confirmação real, nunca ao clicar. Não duplique eventos. No preview são simulações, não conversões reais.
- Para checkout use href={batTracking.attributedUrl("URL_REAL")}. Repasse somente UTMs, fbclid/gclid/msclkid, src/sck; nunca todos os parâmetros, tokens ou dados pessoais. Preserve parâmetros já definidos no destino. Para WhatsApp use batTracking.whatsappUrl("NUMERO_REAL_COM_PAIS", "MENSAGEM"); a origem vai no texto, não em parâmetros não suportados.
- Integrações de atribuição externas/Reportana/CAPI exigem configuração e credenciais próprias: não invente APIs nem alegue conexão ou rastreamento testado. Privados nunca entram no JSX. Prefira recursos React nativos e lucide: sem imports npm extras, sem require, sem eval/new Function.
`;