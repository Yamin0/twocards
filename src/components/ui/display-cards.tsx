"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return mobile;
}

interface DisplayCardProps {
  className?: string;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  date?: string;
  iconClassName?: string;
  titleClassName?: string;
}

function DisplayCard({
  className,
  icon = <Sparkles className="size-4 text-blue-300" />,
  title = "Featured",
  description = "Discover amazing content",
  date = "Just now",
  iconClassName = "bg-blue-800",
  titleClassName = "text-blue-500",
}: DisplayCardProps) {
  return (
    <div
      className={cn(
        /* backdrop-blur réservé au desktop : sur mobile les cartes bougent au
           scroll au-dessus de la vidéo scrubée, et recalculer le flou à chaque
           frame saccade le défilement. Le fond est presque opaque (bg /70-/80),
           la différence est invisible. */
        "relative flex h-36 w-[22rem] -skew-y-[8deg] select-none flex-col justify-between rounded-xl border-2 bg-muted/70 md:backdrop-blur-sm px-4 py-3 transition-all duration-700 after:absolute after:-right-1 after:top-[-5%] after:h-[110%] after:w-[20rem] after:bg-gradient-to-l after:from-background after:to-transparent after:content-[''] hover:border-white/20 hover:bg-muted [&>*]:flex [&>*]:items-center [&>*]:gap-2",
        className
      )}
    >
      <div>
        <span
          className={cn(
            "relative inline-block rounded-full p-1",
            iconClassName
          )}
        >
          {icon}
        </span>
        <p className={cn("text-lg font-medium", titleClassName)}>{title}</p>
      </div>
      <p className="whitespace-nowrap text-lg">{description}</p>
      <p className="text-muted-foreground">{date}</p>
    </div>
  );
}

/* Amplitude du saut, en pixels. Le survol desktop lève de 40 px ; on en garde
   la moitié pour que le geste reste discret sur un petit écran. */
const POP_LIFT = 20;

/* Hors composant : une config recréée à chaque rendu relancerait le ressort. */
const POP_SPRING = { stiffness: 240, damping: 20, mass: 0.5 };

/* Progression de la pile dans le viewport, de 0 (son haut touche le bas de
   l'écran) à 1 (son bas touche le haut) — mêmes bornes que l'offset
   ["start end", "end start"] de useScroll, mais calculées ici pour que les
   valeurs restent inspectables depuis la console. */
function useViewportProgress(
  ref: React.RefObject<HTMLElement | null>,
  active: boolean
) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;

    /* La géométrie n'est mesurée qu'au montage et au resize : un
       getBoundingClientRect à chaque frame de scroll force un layout au
       milieu des écritures de transform des ressorts et saccade le
       défilement. Entre deux mesures, seul scrollY est lu. */
    let top = 0;
    let span = 1;
    let frame = 0;

    const update = () => {
      frame = 0;
      const p = (window.scrollY + window.innerHeight - top) / span;
      progress.set(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const remeasure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY;
      span = window.innerHeight + rect.height;
      update();
    };

    remeasure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
    };
  }, [ref, active, progress]);

  return progress;
}

/* Reproduit le survol desktop sur mobile, mais piloté par le scroll : chaque
   carte se soulève puis retombe quand elle traverse sa portion de défilement.
   Les fenêtres se chevauchent d'une carte à l'autre, ce qui donne une vague
   plutôt qu'un saut simultané. Le ressort ajoute le rebond du « pop ». */
function ScrollPopCard({
  progress,
  index,
  enabled,
  cardProps,
}: {
  progress: MotionValue<number>;
  index: number;
  enabled: boolean;
  cardProps: DisplayCardProps;
}) {
  const start = 0.3 + index * 0.08;
  const peak = start + 0.1;
  const end = start + 0.22;

  /* Translation seule, sans échelle : un scale sur une carte en backdrop-blur
     force le ré-échantillonnage du flou à chaque frame et saccade le scroll. */
  const lift = useTransform(progress, [start, peak, end], [0, -POP_LIFT, 0]);
  const y = useSpring(lift, POP_SPRING);

  return (
    <motion.div style={enabled ? { y, willChange: "transform" } : undefined}>
      <DisplayCard {...cardProps} />
    </motion.div>
  );
}

interface DisplayCardsProps {
  cards?: DisplayCardProps[];
}

export default function DisplayCards({ cards }: DisplayCardsProps) {
  const defaultCards = [
    {
      className:
        "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-16 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
    },
    {
      className:
        "[grid-area:stack] translate-x-32 translate-y-20 hover:translate-y-10",
    },
  ];

  const displayCards = cards || defaultCards;

  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const scrollPop = isMobile && !reduced;

  const stackRef = useRef<HTMLDivElement>(null);
  const progress = useViewportProgress(stackRef, scrollPop);

  return (
    <div
      ref={stackRef}
      className="grid [grid-template-areas:'stack'] place-items-center"
    >
      {displayCards.map((cardProps, index) => (
        /* Le wrapper porte l'arrivée dans le viewport (une fois) et la
           grid-area ; l'enfant porte le saut lié au scroll (rejouable) ; la
           carte garde ses propres translations d'empilement. */
        <motion.div
          key={index}
          className="[grid-area:stack]"
          initial={{ opacity: 0, y: 56, scale: 0.9 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.55,
            delay: index * 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ScrollPopCard
            progress={progress}
            index={index}
            enabled={scrollPop}
            cardProps={cardProps}
          />
        </motion.div>
      ))}
    </div>
  );
}
