import { ArrowRight, Eye, MessageCircle, Paperclip, Pencil, Rocket, Sparkles, Github, Zap } from "lucide-react";
import { Button } from "./ui/button";

const BAT = "M32 6l3 6 4-5 1 7c6-6 14-8 24-5-6 3-9 8-9 15-5-4-11-4-16 0-2-3-5-4-7-4s-5 1-7 4c-5-4-11-4-16 0 0-7-3-12-9-15 10-3 18-1 24 5l1-7 4 5z";
const FEATURES = [
  { icon: MessageCircle, title: "Converse como com um designer", text: "Explique a ideia do seu jeito. A IA pensa junto, sugere e constrói." },
  { icon: Eye, title: "Veja nascer ao vivo", text: "Acompanhe cada seção sendo escrita e abra o resultado na hora." },
  { icon: Pencil, title: "Edite tocando na tela", text: "Troque textos e imagens direto no site, sem escrever código." },
  { icon: Paperclip, title: "Mande prints e referências", text: "A IA lê suas imagens e usa como base para o design." },
  { icon: Rocket, title: "Publique com seu nome", text: "Um toque e o site fica no ar em seu-nome.vercel.app." },
  { icon: Github, title: "Tudo guardado", text: "Cada versão salva no GitHub e na sua nuvem, em qualquer aparelho." },
];

export function ForgeLanding({ onEnter }: { onEnter: () => void }) {
  return <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground">
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="bd-float absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-[120px]"/>
      <div className="bd-float absolute -right-40 top-1/3 h-[32rem] w-[32rem] rounded-full bg-primary/10 blur-[140px]" style={{ animationDelay: "-7s" }}/>
      <div className="bd-beam absolute bottom-0 left-1/2 h-[120vh] w-40 -translate-x-1/2 bg-gradient-to-t from-primary/30 via-primary/5 to-transparent blur-2xl"/>
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"/>
    </div>
    <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <div className="flex items-center gap-2"><svg viewBox="0 0 64 32" aria-hidden className="h-6 w-12 fill-primary"><path d={BAT}/></svg><span className="font-display text-lg font-bold tracking-wider">BAT<span className="text-primary">DEV</span></span></div>
      <Button variant="outline" size="sm" onClick={onEnter}>Entrar</Button>
    </header>
    <section className="relative z-10 mx-auto max-w-4xl px-5 pb-20 pt-14 text-center md:pt-24">
      <div className="bd-rise mx-auto mb-8 w-fit"><svg viewBox="0 0 64 32" aria-hidden className="h-20 w-40 fill-primary drop-shadow-[0_0_40px_var(--primary)] md:h-28 md:w-56"><path d={BAT}/></svg></div>
      <p className="bd-rise mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary" style={{ animationDelay: ".1s" }}><Sparkles className="h-3.5 w-3.5"/> Central de criação com IA</p>
      <h1 className="bd-rise font-display text-5xl font-bold uppercase leading-[0.95] md:text-7xl" style={{ animationDelay: ".2s" }}><span className="bd-shine">Sua ideia vira</span><br/><span className="text-primary">site no ar.</span></h1>
      <p className="bd-rise mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg" style={{ animationDelay: ".3s" }}>Descreva o que precisa. O BatDev desenha, escreve e publica sites profissionais que funcionam no celular e no computador.</p>
      <div className="bd-rise mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: ".4s" }}>
        <Button size="lg" className="h-12 px-7 font-semibold shadow-[0_0_40px_-6px_var(--primary)]" onClick={onEnter}>Começar a criar <ArrowRight/></Button>
      </div>
    </section>
    <section className="relative z-10 mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({ icon: Icon, title, text }, i) => <article key={title} className="bd-rise group rounded-xl border border-border bg-card/60 p-6 backdrop-blur transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_40px_-12px_var(--primary)]" style={{ animationDelay: `${0.5 + i * 0.08}s` }}>
        <Icon className="h-6 w-6 text-primary"/><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </article>)}
    </section>
    <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24 text-center">
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/15 to-transparent p-10">
        <Zap className="mx-auto h-8 w-8 text-primary"/><h2 className="mt-4 font-display text-3xl font-bold uppercase">Pronto para a missão?</h2>
        <Button size="lg" className="mt-6 h-12 px-7 font-semibold" onClick={onEnter}>Entrar no BatDev <ArrowRight/></Button>
      </div>
      <p className="mt-10 text-xs text-muted-foreground">BatDev · {new Date().getFullYear()}</p>
    </section>
  </main>;
}
